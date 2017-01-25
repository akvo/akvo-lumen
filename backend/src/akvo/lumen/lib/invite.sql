-- :name select-active-invites :? :*
-- :doc Return all invites
SELECT id, email, created
FROM invite
WHERE consumed_at IS NULL AND (expiration_time > now());

-- :name insert-invite :<!
-- :doc Insert an invite
INSERT INTO invite (email, expiration_time, author)
VALUES (:email, :expiration_time, :author)
RETURNING *;

-- :name consume-invite :<!
-- :doc Mark invite as used
UPDATE invite
SET consumed_at = now()
WHERE id = :id
RETURNING *;
