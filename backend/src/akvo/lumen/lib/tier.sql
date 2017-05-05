-- :name all-tiers :? :*
-- :doc Return all tiers
SELECT tier,
       data_update->>0 AS data_update,
       max_number_of_visualisations->>0 AS max_number_of_visualisations
FROM CROSSTAB (
     'SELECT tier.title AS tier, policy.title, tier_policy.statement
     FROM tier_policy
     LEFT JOIN tier ON tier.id = tier_policy.tier
     LEFT JOIN policy ON policy.id = tier_policy.policy
     ORDER BY 1',
$$VALUES ('data_update'), ('max_number_of_visualisations')$$
) AS ct ("tier" text, "data_update" jsonb, "max_number_of_visualisations" jsonb);
