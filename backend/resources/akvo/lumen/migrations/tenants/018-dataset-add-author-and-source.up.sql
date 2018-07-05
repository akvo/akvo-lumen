ALTER TABLE public.dataset ADD COLUMN author jsonb;
ALTER TABLE history.dataset ADD COLUMN author jsonb;
ALTER TABLE public.dataset ADD COLUMN source jsonb;
ALTER TABLE history.dataset ADD COLUMN source jsonb;

