ALTER TABLE public.dataset_version ADD COLUMN "data_group" varchar(100) DEFAULT 'main';
ALTER TABLE history.dataset_version ADD COLUMN "data_group" varchar(100) DEFAULT 'main';

ALTER TABLE public.dataset_version
      DROP CONSTRAINT IF EXISTS dataset_version_dataset_id_version_columns_key;

CREATE UNIQUE INDEX dataset_version_dataset_id_version_group_key
ON dataset_version (dataset_id, version, data_group);
