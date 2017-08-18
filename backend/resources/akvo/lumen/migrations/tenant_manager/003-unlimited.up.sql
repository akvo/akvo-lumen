ALTER TABLE plan
      ALTER COLUMN tier TYPE text,
      ALTER COLUMN tier DROP DEFAULT;

DROP TYPE IF EXISTS tier;

CREATE TYPE tier AS ENUM ('unlimited', 'standard', 'pro');

ALTER TABLE plan
      ALTER COLUMN tier TYPE tier USING tier::tier,
      ALTER COLUMN tier SET DEFAULT 'standard';
