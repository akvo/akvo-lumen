ALTER TABLE tenants ADD PRIMARY KEY (id);
-- ;;

CREATE TYPE tier AS ENUM ('standard', 'pro');

CREATE TABLE plan (
       id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
       tenant int REFERENCES tenants (id) NOT NULL,
       tier tier DEFAULT 'standard',
       created timestamptz DEFAULT now(),
       ends timestamptz DEFAULT 'infinity'
);
-- ;;

-- CREATE OR REPLACE FUNCTION public.end_plan (t int)
-- RETURNS trigger AS
-- $$
-- BEGIN

--         UPDATE plan SET ends = now() WHERE tenant = OLD.t AND ends = 'infinity';
--         RETURN NULL;
-- END;
-- $$
-- LANGUAGE 'plpgsql';

-- CREATE TRIGGER end_plan
-- BEFORE INSERT ON plan
-- EXECUTE PROCEDURE end_plan();

-- DROP TRIGGER IF EXISTS tenants_history ON tenants CASCADE;
-- DROP TABLE IF EXISTS history.tenants;

-- ALTER TABLE tenants ADD COLUMN plan tier DEFAULT 'standard';
-- ALTER TABLE tenants ADD COlUMN plan text DEFAULT 'standard';
