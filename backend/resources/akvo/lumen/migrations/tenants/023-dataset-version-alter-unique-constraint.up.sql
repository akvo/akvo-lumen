ALTER TABLE public.dataset_version
      DROP CONSTRAINT IF EXISTS dataset_version_dataset_id_version_key;

CREATE UNIQUE INDEX dataset_version_dataset_id_version_table_name_key ON public.dataset_version (dataset_id, version, md5(columns::text));
