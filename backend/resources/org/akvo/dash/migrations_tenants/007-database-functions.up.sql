
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
  IF trim(both '"' from tmp) = tmp THEN
    RETURN '"' || tmp || '"';
  END IF;
  RETURN tmp;
END;
$BODY$
  LANGUAGE plpgsql IMMUTABLE STRICT;
