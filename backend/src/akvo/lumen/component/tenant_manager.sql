-- :name tenant-by-id :? :1
-- :doc Get tenant by id
SELECT *
FROM tenants
WHERE enabled = true AND label = :label;

-- :name all-tenants :? :*
-- :doc Get all tenants
SELECT *
FROM tenants;

-- :name select-current-plan :? :1
-- :doc Current active plan, expects keys
SELECT plan.tier
FROM plan
LEFT JOIN tenants ON plan.tenant = tenants.id
WHERE tenants.label = :label AND ends = 'infinity';
