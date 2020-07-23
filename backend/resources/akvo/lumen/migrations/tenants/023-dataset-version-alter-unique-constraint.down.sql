ALTER TABLE dataset_version DROP CONSTRAINT IF EXISTS dataset_version_dataset_id_version_columns_key;

ALTER TABLE public.dataset_version
      ADD UNIQUE (dataset_id, version);
