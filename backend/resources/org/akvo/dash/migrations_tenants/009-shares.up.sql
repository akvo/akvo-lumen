CREATE TABLE share (
     id text PRIMARY KEY,
     visualisation_id text REFERENCES visualisation ON DELETE CASCADE,
     dashboard_id text REFERENCES dashboard ON DELETE CASCADE,
     created timestamptz DEFAULT now(),
     modified timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX share_visualisation_idx ON share (visualisation_id);
CREATE UNIQUE INDEX share_dashboard_idx ON share (dashboard_id);
--;;

DO $$
BEGIN
    PERFORM tardis('share');
    PERFORM install_update_modified('share');
END$$;
--;;
