
CREATE OR REPLACE FUNCTION lumen_to_number(val jsonb, default_val jsonb, raise_on_error boolean)
  RETURNS jsonb AS
$$
BEGIN
  RETURN CAST (trim(both '"' from val::text) AS numeric);
EXCEPTION
  WHEN invalid_text_representation THEN
    IF raise_on_error THEN
      RAISE EXCEPTION 'Unable to convert value % to number', val;
    ELSE
      RETURN default_val;
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

CREATE OR REPLACE FUNCTION lumen_to_date(val jsonb, default_val jsonb,
  parse_format text, raise_on_error boolean)
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
EXCEPTION
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS t1 = MESSAGE_TEXT;
    IF raise_on_error THEN
      RAISE EXCEPTION 'Unable to convert % to date value - msg: %', val, t1;
    ELSE
      RETURN default_val;
    END IF;
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


CREATE OR REPLACE FUNCTION lumen_get_update_sql(tbl_name text, col_name text, new_type text, on_error text)
  RETURNS text AS
$$
DECLARE
  initial_sql text = format('UPDATE %I SET %I = lumen_to_%s', tbl_name, col_name, new_type);
BEGIN
  IF new_type = 'text' THEN
    RETURN format('%s(%s) WHERE rnum = $1', inital_sql, col_name);
  ELSIF new_type = 'number' THEN
    IF on_error = 'default-value' THEN
      RETURN format('%s(%s, $1, false) WHERE rnum = $2', initial_sql, col_name);
    ELSIF on_error = 'fail' OR on_error = 'delete-row' THEN
      RETURN format('%s(%s, $1, true) WHERE rnum = $2', initial_sql, col_name);
    ELSE
      RAISE EXCEPTION 'Unknown on_error strategy: %', on_error;
    END IF;
  ELSIF new_type = 'date' THEN
    IF on_error = 'default-value' THEN
      RETURN format('%s(%I, $1, $2, false) WHERE rnum = $3', initial_sql, col_name);
    ELSEIF on_error = 'fail' OR on_error = 'delete-row' THEN
      RETURN format('%s(%I, $1, $2, true) WHERE rnum = $3', initial_sql, col_name);
    ELSE
      RAISE EXCEPTION 'Unknown on_error strategy: %', on_error;
    END IF;
  ELSE
    RAISE EXCEPTION 'Unknown data type: %', new_type;
  END IF;
END;
$$
  LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION lumen_change_data_type(tbl_name text, col_name text,
  new_type text, default_value jsonb, parse_format text, on_error text) RETURNS jsonb AS
$$
DECLARE
  cur refcursor;
  current_rnum integer;
  current_val jsonb;
  exec_log text[];
  select_sql text = format('SELECT rnum, %I FROM %I ORDER BY rnum FOR UPDATE', col_name, tbl_name);
  delete_sql text = format('DELETE FROM %I WHERE ', tbl_name);
  delete_flag text = '''{"delete":true}''::jsonb';
  flag_sql text = format('UPDATE %I SET %I = ' || delete_flag || ' WHERE rnum = $1', tbl_name, col_name);
  update_sql text = lumen_get_update_sql(tbl_name, col_name, new_type, on_error);
  t1 text;
  t2 text;
  t3 text;
BEGIN
  -- tbl_name: table name on which to operate
  -- col_name: column name to change on which to change the values
  -- new_type: 'text' | 'number' | 'date'
  -- on_error: 'default-value' | 'fail' | 'delete-row'


  --RAISE NOTICE 'SELECT SQL: %', select_sql;
  --RAISE NOTICE 'UPDATE SQL: %', update_sql;

  OPEN cur FOR EXECUTE select_sql;

  LOOP
    FETCH FROM cur INTO current_rnum, current_val;
    EXIT WHEN NOT FOUND;
    BEGIN
      IF new_type = 'date' THEN
        EXECUTE update_sql USING default_value, parse_format, current_rnum;
      ELSE
        EXECUTE update_sql USING default_value, current_rnum;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS t1 = MESSAGE_TEXT,
                                t2 = PG_EXCEPTION_DETAIL,
                                t3 = PG_EXCEPTION_HINT;
        --RAISE NOTICE 'Update failed: % - % - % - %', current_val, t1, t2, t3;
	IF on_error = 'delete-row' THEN
	  exec_log = array_append(exec_log, format('Mark to delete: rnum: %s - val: %s', current_rnum, current_val));
	  BEGIN
	    EXECUTE flag_sql USING current_rnum;
	  EXCEPTION
	    WHEN OTHERS THEN
	      GET STACKED DIAGNOSTICS t1 = MESSAGE_TEXT;
	      exec_log = array_append(exec_log, t1);
	    END;
	ELSE
	  RAISE EXCEPTION 'Error processing row: rnum: % - val: % - msg: %', current_rnum, current_val, t1;
	END IF;
    END;
  END LOOP;

  IF on_error = 'delete-row' THEN
    EXECUTE delete_sql || col_name || ' = ' || delete_flag;
  END IF;

  RETURN array_to_json(exec_log);
END;
$$
  LANGUAGE plpgsql VOLATILE;
