CREATE SCHEMA history;
-- ;;


CREATE FUNCTION history.log_change() RETURNS trigger AS $_$
    DECLARE
      c refcursor;
      tt tstzrange;
    BEGIN
        IF TG_OP = 'INSERT' THEN
            EXECUTE 'INSERT INTO history.' || TG_TABLE_NAME ||
              ' SELECT $1.*, tstzrange(now(), $$infinity$$, $$[)$$)' USING NEW;
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

            EXECUTE 'INSERT INTO history.' || TG_TABLE_NAME ||
              ' SELECT $1.*, tstzrange(now(), $$infinity$$, $$[)$$)' USING NEW;

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


CREATE OR REPLACE FUNCTION public.tardis(t text) RETURNS void AS $$
BEGIN

EXECUTE format('
        CREATE TABLE IF NOT EXISTS history.%I (
        LIKE public.%I,
        _validrange tstzrange NOT NULL
        );

        ALTER TABLE ONLY history.%I
        ADD CONSTRAINT %I_exclusion EXCLUDE
        USING gist (id WITH =, _validrange WITH &&);

        CREATE TRIGGER %I_history BEFORE
        INSERT OR DELETE OR UPDATE ON %I
        FOR EACH ROW EXECUTE PROCEDURE history.log_change();
        ', t, t, t, t, t, t);
END
$$ LANGUAGE plpgsql;
-- ;;
