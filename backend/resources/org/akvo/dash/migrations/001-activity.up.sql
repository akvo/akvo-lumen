CREATE TABLE activity (
       id SERIAL PRIMARY KEY,
       user_id text NOT NULL,
       ts timestamp without time zone default (now() at time zone 'utc'),
       event jsonb NOT NULL
);
--;;

GRANT ALL ON activity TO dash;
--;
