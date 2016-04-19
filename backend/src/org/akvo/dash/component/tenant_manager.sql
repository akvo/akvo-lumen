-- :name tenant-by-id :? :1
-- :doc Get tenant by id
SELECT *
FROM tenant
WHERE enabled = true AND label = :label
