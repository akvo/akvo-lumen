-- :name insert-plan :<!
-- :doc Insert plan
INSERT INTO plan (author, tier)
VALUES (:author, :tier)
RETURNING *;
