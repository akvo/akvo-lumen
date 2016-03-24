SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA history;

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

SET search_path = history, pg_catalog;

CREATE FUNCTION log_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
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

                -- What edge case are we missing by commenting the following lines of code?
		-- How can we get the lastxid value?

		--IF NOT lastxid = txid_current() THEN
		--    RAISE EXCEPTION 'UPDATE would have empty validity: %d!', OLD;
		--END IF;

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
$_$;


GRANT ALL ON SCHEMA history to dash;
