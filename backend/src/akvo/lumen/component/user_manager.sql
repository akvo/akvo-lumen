-- :name select-active-invites :? :*
-- :doc Return all invites
SELECT id, email, created
FROM invite
WHERE consumed IS NULL AND (expire >= now());

-- :name insert-invite :<!
-- :doc Insert an invite
INSERT INTO invite (email, expire, author)
VALUES (:email, :expire, :author)
RETURNING *;

-- :name consume-invite :<!
-- :doc Mark invite as used
UPDATE invite
SET consumed = now()
WHERE id = :id
RETURNING *;

-- :name delete-non-consumed-invite-by-id :!
-- :doc Delete invite that is not consumed
DELETE FROM invite
WHERE id = :id AND consumed IS NULL;

-- :name select-consumed-invite-by-id :?
-- :doc Select invite that is consumed
SELECT id
FROM invite
WHERE id = :id and consumed IS NOT NULL;
