DROP FUNCTION IF EXISTS double_precision_to_text(val double precision);
--;;
CREATE OR REPLACE FUNCTION double_precision_to_text(val double precision)
RETURNS text AS $$
BEGIN
  ASSERT val IS NOT NULL;
  RETURN CAST(val AS text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
--;;
