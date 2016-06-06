-- :name all-shares :? :*
-- :doc Return all shares
SELECT *
FROM share;

-- :name insert-visualisation-share :<!
-- :doc Insert a visualisation share. If the visualisation is already shared the existing share id will be returned.
INSERT INTO share (id, visualisation_id)
VALUES (:id, :visualisation-id)
ON CONFLICT (visualisation_id)
DO UPDATE SET visualisation_id=:visualisation-id
WHERE share.visualisation_id=:visualisation-id
RETURNING (id);

-- :name insert-dashboard-share :<!
-- :doc Insert a dashboard share. If the dashboard is already shared the existing share id will be returned.
INSERT INTO share (id, dashboard_id)
VALUES (:id, :dashboard-id)
ON CONFLICT (dashboard_id)
DO UPDATE SET dashboard_id=:dashboard-id
WHERE share.dashboard_id=:dashboard-id
RETURNING (id);

-- :name share-by-item-id :? :1
-- :doc Return share not by share id but item id.
SELECT *
FROM public.share
WHERE visualisation_id = :visualisation-id;


-- :name delete-share-by-id :! :n
-- :doc Remove share.
DELETE FROM share WHERE id=:id;
