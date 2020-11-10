-- :name db-new-data-group :! :n
-- :doc Inserts a new data-group
INSERT INTO data_group (id, group_id, group_name, group_order, dataset_version_id, table_name, imported_table_name, columns, repeatable)
VALUES (:id, :group-id, :group-name, :group-order, :dataset-version-id, :table-name, :imported-table-name, :columns, :repeatable)


-- :name db-list-data-groups-by-dataset-version-id :? :*
-- :doc List data-groups by dataset_version_2 id
SELECT id, group_id, group_name, table_name AS "table-name", imported_table_name AS "imported-table-name", columns, created, modified, repeatable
FROM data_group
WHERE dataset_version_id=:dataset-version-id
ORDER BY group_order, created

-- :name db-get-data-group-by-column-name :? :1
-- :doc Gets a data-group definition by column name
SELECT id, group_id AS "group-id", group_name AS "group-name", group_order AS "group-order", table_name AS "table-name", imported_table_name AS "imported-table-name", columns, created, modified, repeatable
FROM data_group
WHERE columns @> :column-name-filter::jsonb
 AND dataset_version_id=:dataset-version-id


-- :name db-update-reference-on-non-modified-groups :! :n
-- :doc Updates the reference to the parent dataset version for all data-groups different than :modified-data-group-id
UPDATE data_group
   SET dataset_version_id=:new-dataset-version-id
 WHERE dataset_version_id=:old-dataset-version-id
   AND group_id <> :modified-data-group-id
