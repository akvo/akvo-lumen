ALTER TABLE public.dataset_version ADD COLUMN "namespace" varchar(100) DEFAULT 'main';
ALTER TABLE history.dataset_version ADD COLUMN "namespace" varchar(100) DEFAULT 'main';

ALTER TABLE dataset_version DROP CONSTRAINT IF EXISTS dataset_version_dataset_id_version_columns_key;
DROP INDEX IF EXISTS dataset_version_dataset_id_version_columns_key;

CREATE UNIQUE INDEX dataset_version_dataset_id_version_namespace_key
ON dataset_version (dataset_id, version, namespace);
