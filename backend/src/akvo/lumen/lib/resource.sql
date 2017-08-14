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

-- :name select-data-update-by-tier
-- :doc Returns data-update statement by tier
SELECT statement AS "dataUpdate"
FROM tier_policy
WHERE tier = (
      SELECT tier.id
      FROM tier
      WHERE title = :tier)
AND policy = (
    SELECT id
    FROM policy
    WHERE title = 'dataUpdate')

-- :name select-external-datasets :? :1
-- :doc Return..
SELECT COUNT(dataset.id) AS "numberOfExternalDatasets"
FROM dataset
LEFT JOIN dataset_version ON dataset.id = dataset_version.dataset_id
LEFT JOIN job_execution ON dataset_version.job_execution_id = job_execution.id
LEFT JOIN data_source ON job_execution.data_source_id = data_source.id
WHERE data_source.spec::jsonb#>>'{"source", "kind"}' != 'AKVO_FLOW';
