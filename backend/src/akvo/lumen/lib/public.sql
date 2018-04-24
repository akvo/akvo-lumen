-- :name public-by-id :? :1
SELECT id, visualisation_id AS "visualisation-id", dashboard_id AS "dashboard-id", password
FROM share
WHERE id = :id;
