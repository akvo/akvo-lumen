
CREATE TABLE IF NOT EXISTS ds_test_1 (
  rnum serial,
  c1 jsonb,
  c2 jsonb,
  c3 jsonb
);


INSERT INTO ds_test_1 (c1, c2, c3) VALUES ('"akvo"','"10"','"2016-05-23"');
INSERT INTO ds_test_1 (c1, c2, c3) VALUES ('"akvo foundation"','"20.5"','"2016-05-23"');
INSERT INTO ds_test_1 (c1, c2, c3) VALUES ('"akvo lumen"','"42"','"2016-05-23"');

INSERT INTO ds_test_1 (c2) VALUES ('"1,5"');


SELECT lumen_change_data_type('ds_test_1', 'c2', 'number', '0'::jsonb, null, 'fail');
SELECT lumen_change_data_type('ds_test_1', 'c2', 'number', '0'::jsonb, null, 'default-value');

INSERT INTO ds_test_1 (c2) VALUES ('"1,5"');

SELECT lumen_change_data_type('ds_test_1', 'c2', 'number', '0'::jsonb, null, 'delete-row');

-- Testing to_date

SELECT lumen_change_data_type('ds_test_1', 'c3', 'date', '0'::jsonb, 'YYYY-MM-DD', 'fail');

DELETE FROM ds_test_1;

INSERT INTO ds_test_1 (c3) VALUES ('"Not a date"'::jsonb);

SELECT lumen_change_data_type('ds_test_1', 'c3', 'date', '0'::jsonb, 'YYYY-MM-DD', 'default-value');

DELETE FROM ds_test_1;

INSERT INTO ds_test_1 (c3) VALUES ('"Not a date"'::jsonb);

SELECT lumen_change_data_type('ds_test_1', 'c3', 'date', '0'::jsonb, 'YYYY-MM-DD', 'delete-row');
