-- :name db-test-table :!
CREATE TABLE IF NOT EXISTS ds_test_1 (
  rnum serial,
  c1 jsonb,
  c2 jsonb,
  c3 jsonb
);

-- :name db-test-data :! :n
INSERT INTO ds_test_1 (c1, c2, c3) VALUES ('"akvo"','"10"','"2006-10-01"'),
                                          ('"akvo foundation"','"20.5"','"2008-09-01"'),
                                          ('"akvo lumen"','"42"','"2016-05-11"');

-- :name db-delete-test-data :! :n
DELETE FROM ds_test_1

-- :name db-insert-invalid-data :! :n
INSERT INTO ds_test_1 (c1) VALUES ('"Not-a-number-nor-a-date"'::json);


-- :name db-drop-test-table :!
DROP TABLE IF EXISTS ds_test_1 CASCADE

-- :name db-select-test-data :? :*
SELECT * FROM ds_test_1
