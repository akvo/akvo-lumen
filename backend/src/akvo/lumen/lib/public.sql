-- :name public-by-id :? :1
SELECT id, visualisation_id AS "visualisation-id", dashboard_id AS "dashboard-id"
FROM share
WHERE id = :id;
