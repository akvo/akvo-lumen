-- :name all-dashboards :? :*
-- :doc Return all dashboards
SELECT *
FROM dashboard;

-- :name insert-dashboard :<!
-- :doc Insert dashboard.
INSERT INTO dashboard (id, spec)
VALUES (:id, :spec::jsonb)
RETURNING *;

-- :name dashboard-by-id :? :1
-- :doc Return dashboard by id.
SELECT *
FROM dashboard
WHERE id = :id;

-- :name delete-dashboard-by-id :! :n
-- :doc Delete dashboard
DELETE FROM dashboard
WHERE id = :id
