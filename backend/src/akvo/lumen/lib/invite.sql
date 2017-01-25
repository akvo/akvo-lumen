-- :name select-active-invites :? :*
-- :doc Return all invites
SELECT *
FROM invite;
-- WHERE NOT EXPIRED OR CONSUMED

-- :name insert-invite :<!
-- :doc Insert an invite
INSERT INTO invite (email, expiration_time, author)
VALUES (:email, :expiration_time, :author)
RETURNING *;
