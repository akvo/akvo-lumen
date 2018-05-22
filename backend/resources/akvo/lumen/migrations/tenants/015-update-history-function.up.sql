CREATE OR REPLACE FUNCTION extract_cols_as_char (tablename CHARACTER, my_prefix CHARACTER DEFAULT '')
    RETURNS varchar
AS $func$
DECLARE
    i text;
    str varchar;
BEGIN
    str := '';
    FOR i IN
    SELECT column_name FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
        table_name = tablename
        AND table_schema = 'public'
    LOOP
        str := str || ',' || my_prefix || i;
    END LOOP;
    RETURN SUBSTRING(str FROM 2);
END
$func$
LANGUAGE PLPGSQL;

CREATE OR REPLACE FUNCTION history.log_change() RETURNS trigger AS $_$
    DECLARE
      c refcursor;
      tt tstzrange;
      insert_into_fields text;
      select_from_fields text;

    BEGIN
        insert_into_fields := extract_cols_as_char(TG_TABLE_NAME::text);

        select_from_fields := extract_cols_as_char(TG_TABLE_NAME::text, '$1.');

        IF TG_OP = 'INSERT' THEN
            EXECUTE 'INSERT INTO history.' || TG_TABLE_NAME || ' (_validrange, ' || insert_into_fields || ' )'
  	    ' SELECT tstzrange(now(), $$infinity$$, $$[)$$), ' || select_from_fields || '' USING NEW;
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

            EXECUTE 'INSERT INTO history.' || TG_TABLE_NAME || ' (_validrange, ' || insert_into_fields || ' )'
  	    ' SELECT tstzrange(now(), $$infinity$$, $$[)$$), ' || select_from_fields || '' USING NEW;
            RETURN NEW;

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
-- ;;
