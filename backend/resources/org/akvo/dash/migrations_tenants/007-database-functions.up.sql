
CREATE OR REPLACE FUNCTION lumen_to_number(val jsonb, default_val numeric)
  RETURNS jsonb AS
$$
BEGIN
  RETURN CAST (trim(both '"' from val::text) AS numeric);
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN default_val;
END;
$$
  LANGUAGE plpgsql IMMUTABLE STRICT;


CREATE OR REPLACE FUNCTION lumen_to_number(val jsonb, raise_on_error boolean)
  RETURNS jsonb AS
$$
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
$$
  LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION lumen_to_text(val jsonb)
  RETURNS jsonb AS
$$
DECLARE
  tmp text = val::text;
BEGIN
  IF left(tmp, 1) = '"' THEN
    RETURN tmp;
  END IF;
  RETURN '"' || tmp || '"';
END;
$$
  LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION lumen_to_date(val jsonb, format text, raise_on_error boolean)
  RETURNS jsonb AS
$$
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
$$
  LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION lumen_to_date(val jsonb, format text)
  RETURNS jsonb AS
$$
BEGIN
  RETURN to_date(val, format, false);
END;
$$
  LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION lumen_titlecase(val jsonb)
  RETURNS jsonb AS
$$
BEGIN
  RETURN initcap(val::text);
END;
$$
  LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION lumen_trim_double(val jsonb)
  RETURNS jsonb AS
$$
BEGIN
  RETURN regexp_replace(val::text, '\s+', ' ', 'g');
END;
$$
  LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION lumen_trim(val jsonb)
  RETURNS jsonb AS
$$
BEGIN
  RETURN regexp_replace(val::text, '^"(\s+)|(\s+)"$', '"', 'g');
END;
$$
  LANGUAGE plpgsql IMMUTABLE STRICT;
