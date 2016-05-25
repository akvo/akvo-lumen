CREATE TABLE share (
       id text PRIMARY KEY,
       visualisation_id text REFERENCES visualisation ON DELETE CASCADE,
       created timestamptz DEFAULT now(),
       modified timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX share_visualisation_idx ON share (visualisation_id);
--;;

DO $$
BEGIN
    PERFORM tardis('share');
    PERFORM install_update_modified('share');
END$$;
--;;
