-- :name all-shares :? :*
-- :doc Return all shares
SELECT *
FROM share;

-- :name insert-share :<!
-- :doc Insert share.
INSERT INTO share (id, visualisation_id, spec)
VALUES (:id, :visualisation-id, :spec::jsonb)
RETURNING *;

-- :name share-by-item-id :? :1
-- :doc Return share not by share id but item id.
SELECT *
FROM public.share
WHERE visualisation_id = :visualisation-id;


-- :name delete-share-by-id :! :n
-- :doc Remove share.
DELETE FROM share WHERE id=:id;
