ALTER TABLE history.dataset_version DROP COLUMN "data_group";
ALTER TABLE public.dataset_version DROP COLUMN "data_group";

ALTER TABLE dataset_version DROP CONSTRAINT IF EXISTS dataset_version_dataset_id_version_group_key;
DROP INDEX IF EXISTS dataset_version_dataset_id_version_group_key;

CREATE UNIQUE INDEX dataset_version_dataset_id_version_columns_key
ON dataset_version (dataset_id, version, md5(columns::text));
