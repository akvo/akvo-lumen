-- :name tenant-by-id :? :1
-- :doc Get tenant by id
SELECT *
FROM tenants
WHERE enabled = true AND label = :label
