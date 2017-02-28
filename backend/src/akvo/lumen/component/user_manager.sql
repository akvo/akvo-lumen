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

-- :name delete-active-invite-by-id :!
-- :doc Delete invite
DELETE FROM invite
WHERE id = :id AND (expire >= now() OR consumed IS NOT NULL);

-- :name select-invite-by-id :?
-- :doc Select invite even if it's consumed or expired
SELECT id
FROM invite
WHERE id = :id;
