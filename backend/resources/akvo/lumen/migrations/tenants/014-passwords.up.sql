DROP TRIGGER IF EXISTS share_history ON public.share RESTRICT;
DROP TABLE IF EXISTS history.share;

ALTER TABLE public.share ADD COLUMN password text;
ALTER TABLE public.share ADD COLUMN protected BOOLEAN DEFAULT FALSE;
ALTER TABLE public.share
      ADD CONSTRAINT protected_needs_password
      CHECK ( (NOT protected) OR (protected is NOT NULL))
