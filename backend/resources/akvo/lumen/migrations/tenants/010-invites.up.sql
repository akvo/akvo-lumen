CREATE TABLE invite (
     id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
     email text NOT NULL,
     expire timestamptz,
     consumed timestamptz,
     author jsonb NOT NULL,
     created timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX invite_expire_idx ON invite (expire);
CREATE UNIQUE INDEX invite_consumed_idx ON invite (consumed);
