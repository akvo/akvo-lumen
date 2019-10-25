-- :name insert-invite :<!
-- :doc Insert an invite.
INSERT INTO invite (email, expire, author)
VALUES (
       :email,
       :expire,
       (SELECT jsonb_object_agg(key, value) FROM jsonb_each(:author) WHERE key IN ('name', 'given_name', 'family_name', 'email'))
)
RETURNING *;

-- :name select-active-invites :? :*
-- :doc Return all invites.
SELECT id, email, created
FROM invite
WHERE consumed IS NULL AND (expire >= now());

-- :name delete-invite-by-id :!
-- :doc Delete invite that is not consumed.
DELETE FROM invite
WHERE id = :id AND consumed IS NULL;

-- :name consume-invite :<!
-- :doc Mark invite as used
UPDATE invite
SET consumed = now()
WHERE id = :id
RETURNING *;
