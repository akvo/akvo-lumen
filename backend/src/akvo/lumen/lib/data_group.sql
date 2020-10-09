-- :name db-new-data-group :! :n
-- :doc Inserts a new data-group
INSERT INTO data_group (id, group_id, group_name, dataset_version_id, table_name, imported_table_name, columns, repeatable)
VALUES (:id, :group-id, :group-name, :dataset-version-id, :table-name, :imported-table-name, :columns, :repeatable)


-- :name db-list-data-groups-by-dataset-version-id :? :*
-- :doc List data-groups by dataset_version_2 id
SELECT id, group_id, group_name, table_name AS "table-name", imported_table_name AS "imported-table-name", columns, created, modified, repeatable
FROM data_group
WHERE dataset_version_id=:dataset-version-id
