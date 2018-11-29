
-- :name all-data :?
-- :doc Get all data from a data table
SELECT * FROM :i:table-name

-- :name set-cell-value :!
-- :doc Set cell value
UPDATE :i:table-name SET :i:column-name = :value WHERE rnum=:rnum

-- :name delete-row :!
-- :doc Delete a row
DELETE FROM :i:table-name WHERE rnum=:rnum
