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

-- Default plan
INSERT INTO plan (tenant, tier)
SELECT id, 'standard'
FROM tenants
