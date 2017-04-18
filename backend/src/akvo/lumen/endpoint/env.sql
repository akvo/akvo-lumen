-- :name select-plan :? :1
-- :doc Return current plan
SELECT tier.title
FROM plan
LEFT JOIN tier ON tier.id = plan.tier
WHERE plan.ends = 'infinity';

-- :name insert-plan :<!
-- :doc Insert plan
INSERT INTO plan (author, tier)
VALUES (:author, :tier)
RETURNING *;
