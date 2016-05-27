CREATE TABLE dashboard (
    id text PRIMARY KEY,
    title text NOT NULL,
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

CREATE TABLE dashboard_visualisation (
    dashboard_id text REFERENCES dashboard (id) ON UPDATE CASCADE ON DELETE CASCADE,
    visualisation_id text REFERENCES visualisation (id) ON UPDATE CASCADE,
    layout jsonb,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now(),
    CONSTRAINT dashboard_visualisation_pkey PRIMARY KEY (dashboard_id, visualisation_id)
);
--;;

DO $$
BEGIN
    -- PERFORM tardis('dashboard_visualisation');
    PERFORM install_update_modified('dashboard_visualisation');
END$$;
--;;
