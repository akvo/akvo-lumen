CREATE TABLE tier (
     id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
     title text NOT NULL UNIQUE CHECK (title IN ('lite','standard','pro','enterprice'))
);

INSERT INTO tier (title) VALUES ('lite');
INSERT INTO tier (title) VALUES ('standard');
INSERT INTO tier (title) VALUES ('pro');
INSERT INTO tier (title) VALUES ('enterprice');

-- ;;

CREATE OR REPLACE FUNCTION standard_tier_id() RETURNS text LANGUAGE SQL AS
$$ SELECT id FROM tier WHERE title = 'standard'; $$;

CREATE TABLE plan (
     id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
     tier text REFERENCES tier (id) DEFAULT standard_tier_id(),
     starts timestamptz DEFAULT now(),
     ends timestamptz DEFAULT 'infinity',
     author jsonb
);

-- ;;


-- ALTER TABLE plan
--      ADD CONSTRAINT unique_plan_per_daterange
--      EXCLUDE USING gist
--      (
--      tstzrange(starts, ends, '[]') with &&
--      );


-- ;;

CREATE OR REPLACE FUNCTION public.end_plans_fn ()
RETURNS trigger AS
$$
BEGIN
     UPDATE plan SET ends = now() WHERE ends = 'infinity';
     RETURN NULL;
END;
$$
LANGUAGE 'plpgsql';

CREATE TRIGGER end_plans
BEFORE INSERT ON plan
EXECUTE PROCEDURE end_plans_fn();
