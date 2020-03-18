CREATE TYPE tier AS ENUM ('unlimited', 'standard', 'pro');

CREATE TABLE plan (
       id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
       tenant int REFERENCES tenants (id) NOT NULL,
       tier tier DEFAULT 'standard',
       created timestamptz DEFAULT now(),
       ends timestamptz DEFAULT 'infinity'
);

CREATE UNIQUE INDEX plan_tenant_ends_key ON plan (tenant, ends)
WHERE ends = 'infinity';
-- ;;

-- Default plan
INSERT INTO plan (tenant, tier)
SELECT id, 'standard'
FROM tenants
