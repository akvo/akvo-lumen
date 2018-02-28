-- # Done
DROP TRIGGER IF EXISTS collection_entity_history ON collection_entity CASCADE;
DROP TABLE IF EXISTS history.collection_entity cascade;
ALTER TABLE public.collection_entity
      ADD COLUMN raster_dataset_id text REFERENCES raster_dataset (id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.collection_entity
      ADD UNIQUE (collection_id, raster_dataset_id);
ALTER TABLE public.collection_entity
      DROP CONSTRAINT IF EXISTS one_entity;

ALTER TABLE public.collection_entity
      ADD CONSTRAINT one_entity CHECK (
          (CASE WHEN dataset_id IS NULL THEN 0 ELSE 1 END) +
          (CASE WHEN visualisation_id IS NULL THEN 0 ELSE 1 END) +
          (CASE WHEN dashboard_id IS NULL THEN 0 ELSE 1 END) +
          (CASE WHEN raster_dataset_id IS NULL THEN 0 ELSE 1 END) = 1
);
