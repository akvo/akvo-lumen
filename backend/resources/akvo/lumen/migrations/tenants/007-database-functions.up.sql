-- There are two versions of each datatype change functions. One with
-- default_value and one without. The one without default_value will
-- not flow NULLs through and instead raise an exception. The
-- functions with default_value will not flow NULLs through
-- either. Instead, the default_value is returned (where default_value
-- is allowed to be NULL).

-- text -> double precision
CREATE OR REPLACE FUNCTION text_to_double_precision(val text, default_value double precision)
RETURNS double precision AS $$
BEGIN
  IF val IS NULL THEN
    RETURN default_value;
  ELSE
    RETURN cast(val AS double precision);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
  RETURN default_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION text_to_double_precision(val text)
RETURNS double precision AS $$
BEGIN
  ASSERT val IS NOT NULL;
  RETURN cast(val AS double precision);
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- date -> double precision
CREATE OR REPLACE FUNCTION date_to_double_precision(val timestamptz, default_value double precision)
RETURNS double precision AS $$
BEGIN
  IF val IS NULL THEN
    RETURN default_value;
  ELSE
    RETURN date_part('epoch', val);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
  RETURN default_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION date_to_double_precision(val timestamptz)
RETURNS double precision AS $$
BEGIN
  ASSERT val IS NOT NULL;
  RETURN date_part('epoch', val);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- text -> timestamptz
CREATE OR REPLACE FUNCTION text_to_timestamptz(val text, parse_format text, default_value timestamptz)
RETURNS timestamptz AS $$
BEGIN
  IF val IS NULL THEN
    RETURN default_value;
  ELSE
    RETURN to_timestamp(val, parse_format);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN default_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION text_to_timestamptz(val text, parse_format text)
RETURNS timestamptz AS $$
BEGIN
  ASSERT val IS NOT NULL;
  RETURN to_timestamp(val, parse_format);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- double precision -> timestamptz
CREATE OR REPLACE FUNCTION double_precision_to_timestamptz(val double precision, default_value timestamptz)
RETURNS timestamptz AS $$
BEGIN
  IF val IS NULL THEN
    RETURN default_value;
  ELSE
    RETURN to_timestamp(val);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN default_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION double_precision_to_timestamptz(val double precision)
RETURNS timestamptz AS $$
BEGIN
  ASSERT val IS NOT NULL;
  RETURN to_timestamp(val);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- double precision -> text
CREATE OR REPLACE FUNCTION double_precision_to_text(val double precision, default_value text)
RETURNS text AS $$
BEGIN
  IF val IS NULL THEN
    RETURN default_value;
  ELSE
    RETURN CAST(val AS text);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN default_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION double_precision_to_text(val double precision)
RETURNS timestamptz AS $$
BEGIN
  ASSERT val IS NOT NULL;
  RETURN CAST(val AS text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- timestamptz -> text
CREATE OR REPLACE FUNCTION timestamptz_to_text(val timestamptz, default_value text)
RETURNS text AS $$
BEGIN
  IF val IS NULL THEN
    RETURN default_value;
  ELSE
    RETURN CAST(val AS text);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN default_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION timestamptz_to_text(val timestamptz)
RETURNS timestamptz AS $$
BEGIN
  ASSERT val IS NOT NULL;
  RETURN CAST(val AS text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
