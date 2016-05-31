
CREATE OR REPLACE FUNCTION lumen_to_number(val jsonb)
  RETURNS jsonb AS
$$
BEGIN
  RETURN CAST (trim(both '"' from val::text) AS numeric);
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

CREATE OR REPLACE FUNCTION lumen_to_date(val jsonb, parse_format text)
  RETURNS jsonb AS
$$
DECLARE
  tval text = val::text;
  tmp text = trim(both '"' from tval);
  t1 text;
BEGIN
  IF tmp = tval THEN
    RAISE EXCEPTION 'Value was not text: %', tval;
  END IF;
  RETURN date_part('epoch', to_timestamp(tmp, parse_format))::numeric;
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
  RETURN regexp_replace(val::text, '(\s|\t|\n)+', ' ', 'g');
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


CREATE OR REPLACE FUNCTION lumen_change_data_type(tbl_name text, args jsonb, on_error text)
  RETURNS text[] AS
$$
DECLARE
  cur refcursor;
  current_rnum integer;
  current_val jsonb;
  exec_log text[];
  select_sql text;
  delete_sql text;
  update_sql text;
  flag_sql text;
  change_sql text;
  delete_flag jsonb = '{"delete": true}'::jsonb;
  col_name text = args->>'columnName';
  new_type text = args->>'newType';
  default_value jsonb = args->'defaultValue';
  parse_format text = args->>'parseFormat';
  t1 text;
  t2 text;
  t3 text;
BEGIN

  -- tbl_name: table name on which to operate
  -- col_name: column name to change on which to change the values
  -- new_type: 'text' | 'number' | 'date'
  -- on_error: 'default-value' | 'fail' | 'delete-row'

  IF tbl_name IS NULL OR tbl_name = '' THEN
    RAISE EXCEPTION 'tbl_name is required';
  END IF;

  IF col_name IS NULL OR char_length(col_name) = 0 THEN
    RAISE EXCEPTION 'col_name is required';
  END IF;

  IF new_type IS NULL OR char_length(new_type) = 0 THEN
    RAISE EXCEPTION 'new_type is required';
  END IF;

  IF new_type != 'number' AND new_type != 'date' AND new_type != 'text' THEN
    RAISE EXCEPTION 'Invalid new type: %', new_type;
  END IF;

  IF new_type = 'date' AND (parse_format IS NULL OR char_length(parse_format) = 0) THEN
    RAISE EXCEPTION 'parseFormat is required for date values';
  END IF;

  IF on_error != 'default-value' AND on_error != 'fail' AND on_error != 'delete-row' THEN
    RAISE EXCEPTION 'Invalid onError value: %', on_error;
  END IF;


  select_sql = format('SELECT rnum, %I FROM %I ORDER BY rnum FOR UPDATE', col_name, tbl_name);
  delete_sql = format('DELETE FROM %I WHERE %I = $1', tbl_name, col_name);
  update_sql = format('UPDATE %I SET %I = $1 WHERE rnum = $2', tbl_name, col_name);

  IF new_type = 'date' THEN
    change_sql = format('UPDATE %I SET %I = lumen_to_date(%I, $1) WHERE rnum = $2', tbl_name, col_name, col_name);
  ELSE
    change_sql = format('UPDATE %I SET %I = lumen_to_%s(%I) WHERE rnum = $1', tbl_name, col_name, new_type, col_name);
  END IF;


  OPEN cur FOR EXECUTE select_sql;

  LOOP
    FETCH FROM cur INTO current_rnum, current_val;
    EXIT WHEN NOT FOUND;
    BEGIN
      IF new_type = 'date' THEN
        EXECUTE change_sql USING parse_format, current_rnum;
      ELSE
        EXECUTE change_sql USING current_rnum;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS t1 = MESSAGE_TEXT,
                                t2 = PG_EXCEPTION_DETAIL,
                                t3 = PG_EXCEPTION_HINT;
	IF on_error = 'fail' THEN
	  RAISE EXCEPTION 'Fail to convert value % to % - rnum: %', current_val, new_type, current_rnum;
	ELSIF on_error = 'default-value' THEN
          exec_log = array_append(exec_log, format('Changing to default value - rnum: %s - val: %s - default: %s',
	                                           current_rnum, current_val, default_value::text));
	  EXECUTE update_sql USING default_value, current_rnum;
	ELSIF on_error = 'delete-row' THEN
	  exec_log = array_append(exec_log, format('Mark to delete: rnum: %s - val: %s', current_rnum, current_val));
	  EXECUTE update_sql USING delete_flag, current_rnum;
	END IF;
    END;
  END LOOP;

  IF on_error = 'delete-row' THEN
    EXECUTE delete_sql USING delete_flag;
  END IF;

  RETURN exec_log;
END;
$$
  LANGUAGE plpgsql VOLATILE;
