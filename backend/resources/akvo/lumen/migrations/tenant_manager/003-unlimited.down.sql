ALTER TABLE plan
      ALTER COLUMN tier type text,
      ALTER COLUMN tier DROP DEFAULT;

DROP TYPE IF EXISTS tier;

CREATE TYPE tier AS ENUM ('standard', 'pro');

ALTER TABLE plan
      ALTER COLUMN tier TYPE tier USING tier::tier,
      ALTER COLUMN tier SET DEFAULT 'standard';

ALTER TABLE plan
      DROP CONSTRAINT plan_tenant_fkey,
      ADD CONSTRAINT plan_tenant_fkey
      FOREIGN KEY (tenant)
      REFERENCES tenants (id);
