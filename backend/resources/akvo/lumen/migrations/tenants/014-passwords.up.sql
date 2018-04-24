DROP TRIGGER IF EXISTS share_history ON public.share RESTRICT;
DROP TABLE IF EXISTS history.share;
ALTER TABLE public.share ADD COLUMN password text;
