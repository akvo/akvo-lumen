ALTER TABLE public.raster_dataset
      ADD COLUMN IF NOT EXISTS author jsonb;
