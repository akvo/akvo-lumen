-- :name all-values
-- :doc All values defined in `environment` table
SELECT id, "value" FROM environment

-- :name upsert-env :<!
-- :doc Upsert a env value
INSERT INTO environment (id, "value")
VALUES (:id, :value)
ON CONFLICT (id)
DO UPDATE SET "value" = :value
RETURNING *;
