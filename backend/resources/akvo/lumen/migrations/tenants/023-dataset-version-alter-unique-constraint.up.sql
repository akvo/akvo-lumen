ALTER TABLE dataset_version DROP CONSTRAINT IF EXISTS adataset_version_dataset_id_version_key;

CREATE UNIQUE INDEX dataset_version_dataset_id_version_columns_key
ON dataset_version (dataset_id, version, md5(columns::text));
