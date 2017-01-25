CREATE TABLE invite (
     id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
     email text NOT NULL,
     expiration_time timestamptz,
     consumed_at timestamptz,
     author jsonb NOT NULL,
     created timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX invite_expiration_time_idx ON invite (expiration_time);
CREATE UNIQUE INDEX invite_consumed_at_idx ON invite (consumed_at);
