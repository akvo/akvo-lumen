CREATE OR REPLACE FUNCTION prefix_arr (arr text[], prefix_ text) RETURNS text[] AS $_$
 DECLARE
 e text;
 new_arr text[] := '{}';
 BEGIN
   FOREACH e IN ARRAY arr LOOP
      e := concat(prefix_, e);
      new_arr := new_arr || e;
   END LOOP;
   RETURN new_arr;
 END;
$_$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION extract_cols (tablename text) RETURNS text[] AS $_$
 BEGIN
 RETURN ARRAY(SELECT column_name::text
              FROM information_schema.columns 
              WHERE table_name = tablename AND table_schema = 'public' 
              ORDER BY ordinal_position);
 END
$_$ LANGUAGE PLPGSQL STABLE;

CREATE OR REPLACE FUNCTION get_insert_sql_history (tablename text) RETURNS text AS $_$
   DECLARE
   insert_into_fields text;
   select_from_fields text;
   BEGIN

     insert_into_fields := array_to_string(extract_cols(tablename), ',');

     select_from_fields := array_to_string(prefix_arr(extract_cols(tablename),'$1.'), ',');

     RETURN 'INSERT INTO history.' || tablename || ' (_validrange, ' || insert_into_fields || ' ) '
            'SELECT tstzrange(now(), $$infinity$$, $$[)$$), ' || select_from_fields || '';
   END
   $_$ LANGUAGE PLPGSQL STABLE;

CREATE OR REPLACE FUNCTION history.log_change() RETURNS trigger AS $_$
    DECLARE
      c refcursor;
      tt tstzrange;

    BEGIN
        IF TG_OP = 'INSERT' THEN
            EXECUTE get_insert_sql_history(TG_TABLE_NAME::text) USING NEW;
            RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
            OPEN c FOR EXECUTE 'SELECT _validrange FROM history.' || TG_TABLE_NAME ||
              ' WHERE id = $1 ORDER BY _validrange DESC LIMIT 1 FOR UPDATE'
              USING NEW.id;
            FETCH FROM c INTO tt;

            IF isempty(tstzrange(lower(tt), now(), $$[)$$)) THEN
               EXECUTE 'DELETE FROM history.' || TG_TABLE_NAME ||
                  ' WHERE CURRENT OF ' || quote_ident(c::text);
            ELSE
                EXECUTE 'UPDATE history.' || TG_TABLE_NAME || ' SET _validrange = tstzrange($1, now(), $$[)$$)' ||
                  ' WHERE CURRENT OF ' || quote_ident(c::text) USING lower(tt);
            END IF;

            EXECUTE get_insert_sql_history(TG_TABLE_NAME::text) USING NEW;

            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN

          OPEN c FOR EXECUTE 'SELECT _validrange FROM history.' || TG_TABLE_NAME ||
            ' WHERE id = $1 ORDER BY _validrange DESC LIMIT 1 FOR UPDATE' USING OLD.id;

          FETCH FROM c into tt;

          IF isempty(tstzrange(lower(tt), now(), $$[)$$)) THEN
            EXECUTE 'DELETE FROM history.' || TG_TABLE_NAME ||
              ' WHERE CURRENT OF ' || quote_ident(c::text);
            RETURN OLD;
          END IF;

          EXECUTE 'UPDATE history.' || TG_TABLE_NAME ||
            ' SET _validrange = tstzrange($1, now(), $$[)$$) WHERE CURRENT OF ' ||
            quote_ident(c::text) USING lower(tt);

          RETURN OLD;
        END IF;
        RETURN NULL;
    END;
$_$ LANGUAGE plpgsql;
