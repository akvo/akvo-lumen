ALTER TABLE history.dataset_version DROP COLUMN IF EXISTS "namespace";
ALTER TABLE public.dataset_version DROP COLUMN IF EXISTS "namespace";

ALTER TABLE dataset_version DROP CONSTRAINT IF EXISTS dataset_version_dataset_id_version_namespace_key;
DROP INDEX IF EXISTS dataset_version_dataset_id_version_namespace_key;

CREATE UNIQUE INDEX dataset_version_dataset_id_version_columns_key
ON dataset_version (dataset_id, version, md5(columns::text));
