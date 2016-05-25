CREATE TABLE dashboard (
    id text PRIMARY KEY,
    spec jsonb,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now()
);
--;;

DO $$
BEGIN
    PERFORM tardis('dashboard');
    PERFORM install_update_modified('dashboard');
END$$;
--;;

-- CREATE TABLE dashboard_visualisation (
--     dashboard_id text REFERENCES dashboard (id) ON UPDATE CASCADE ON DELETE CASCADE,
--     visualisation_id text REFERENCES visualisation (id) ON UPDATE CASCADE,
--     spec jsonb
-- );
