-- :name count-visualisations :? :1
-- :doc Returns the count of visualisations
SELECT COUNT (*) AS "numberOfVisualisations"
FROM visualisation;

-- :name count-external-datasets :? :1
-- :doc Return..
SELECT COUNT(dataset.id) AS "numberOfExternalDatasets"
FROM dataset
LEFT JOIN dataset_version ON dataset.id = dataset_version.dataset_id
LEFT JOIN job_execution ON dataset_version.job_execution_id = job_execution.id
LEFT JOIN data_source ON job_execution.data_source_id = data_source.id
WHERE data_source.spec::jsonb#>>'{"source", "kind"}' != 'AKVO_FLOW';
