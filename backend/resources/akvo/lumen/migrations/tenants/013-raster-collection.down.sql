ALTER TABLE public.collection_entity
      DROP CONSTRAINT IF EXISTS one_entity;

ALTER TABLE public.collection_entity
      ADD CONSTRAINT one_entity CHECK (
          (CASE WHEN dataset_id IS NULL THEN 0 ELSE 1 END) +
          (CASE WHEN visualisation_id IS NULL THEN 0 ELSE 1 END) +
          (CASE WHEN dashboard_id IS NULL THEN 0 ELSE 1 END) = 1
);

ALTER TABLE public.collection_entity
      DROP CONSTRAINT IF EXISTS collection_entity_collection_id_raster_dataset_id_key;

ALTER TABLE public.collection_entity
      DROP COLUMN raster_dataset_id;

DO $$
BEGIN
    PERFORM tardis('collection_entity');
END$$;
