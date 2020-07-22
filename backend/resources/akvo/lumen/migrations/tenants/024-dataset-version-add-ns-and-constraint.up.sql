ALTER TABLE public.dataset_version ADD COLUMN "ns" varchar(100) DEFAULT 'v1';
ALTER TABLE history.dataset_version ADD COLUMN "ns" varchar(100) DEFAULT 'v1';

ALTER TABLE dataset_version DROP CONSTRAINT IF EXISTS dataset_version_dataset_id_version_columns_key;
DROP INDEX IF EXISTS dataset_version_dataset_id_version_columns_key;

CREATE UNIQUE INDEX dataset_version_dataset_id_version_ns_key
ON dataset_version (dataset_id, version, ns);
