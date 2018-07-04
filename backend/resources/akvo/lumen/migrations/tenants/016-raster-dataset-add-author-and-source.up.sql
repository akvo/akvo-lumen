ALTER TABLE public.raster_dataset ADD COLUMN author jsonb;
ALTER TABLE public.raster_dataset ADD COLUMN source jsonb;
ALTER TABLE history.raster_dataset ADD COLUMN author jsonb;
ALTER TABLE history.raster_dataset ADD COLUMN source jsonb;
