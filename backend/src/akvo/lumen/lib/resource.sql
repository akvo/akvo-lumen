-- :name select-plan :? :1
-- :doc Return current plan
SELECT tier.title AS tier, plan.created
FROM plan
LEFT JOIN tier ON tier.id = plan.tier
WHERE plan.ends = 'infinity';

-- :name count-visualisations :? :1
-- :doc Returns the count of visualisations
SELECT COUNT (*) AS "numberOfVisualisations"
FROM visualisation;

-- :name select-policies :? :*
-- :doc Returns a list of all resources policies
SELECT title
FROM policy
