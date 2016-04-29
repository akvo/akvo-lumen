
CREATE OR REPLACE FUNCTION to_number(val jsonb, default_val numeric)
  RETURNS jsonb AS
$BODY$
BEGIN
  RETURN CAST (trim(both '"' from val::text) AS numeric);
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN default_val;
END;
$BODY$
  LANGUAGE plpgsql IMMUTABLE STRICT;


CREATE OR REPLACE FUNCTION to_number(val jsonb, raise_on_error boolean)
  RETURNS jsonb AS
$BODY$
BEGIN
  RETURN CAST (trim(both '"' from val::text) AS numeric);
EXCEPTION
  WHEN invalid_text_representation THEN
    IF raise_on_error THEN
      RAISE EXCEPTION 'Unable to convert value % to number', val;
    ELSE
      RETURN NULL;
    END IF;
END;
$BODY$
  LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION to_text(val jsonb)
  RETURNS jsonb AS
$BODY$
DECLARE
  tmp text = val::text;
BEGIN
  IF left(tmp, 1) = '"' THEN
    RETURN tmp;
  END IF;
  RETURN '"' || tmp || '"';
END;
$BODY$
  LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION to_date(val jsonb, format text, raise_on_error boolean)
  RETURNS jsonb AS
$BODY$
DECLARE
  tmp text = trim(both '"' from val::text);
BEGIN
  RETURN date_part('epoch', to_timestamp(tmp, format))::numeric;
EXCEPTION
  WHEN OTHERS THEN
  IF raise_on_error THEN
    RAISE EXCEPTION 'Unable to convert % to date value', val;
  ELSE
    RETURN NULL;
  END IF;
END;
$BODY$
  LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION to_date(val jsonb, format text)
  RETURNS jsonb AS
$BODY$
BEGIN
  RETURN to_date(val, format, false);
END;
$BODY$
  LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION split_column(column_name text, table_name text, delimeter text)
  RETURNS void AS
$BODY$
DECLARE
  r record;
  rnum int = 0;
  max_length smallint = 0;
  cur_length smallint = 0;
BEGIN
  FOR r IN EXECUTE format('SELECT rnum, string_to_array(trim(both ''"'' from %s::text), $1) as a FROM %s',
    column_name, table_name) USING delimeter
  LOOP
    cur_length = array_length(r.a, 1);
    IF cur_length > max_length THEN
      max_length = cur_length;
      rnum = r.rnum;
    END IF;
  END LOOP;
  RAISE EXCEPTION 'rnum: % - max: %', rnum, max_length;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE;
