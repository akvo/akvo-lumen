
-- :name select-col-1 :? :*
-- :doc Get all values for col1
SELECT rnum, c1 FROM ds_raw_1 ORDER BY rnum

-- :name update-col-1 :! :n
-- :doc Update the col1 for a given rnum
UPDATE ds_raw_1 SET c1 = to_jsonb(:c1) WHERE rnum = :rnum
