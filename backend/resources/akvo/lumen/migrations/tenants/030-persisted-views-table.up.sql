CREATE TABLE persisted_view (
    id text PRIMARY KEY,
    visualisation_id text REFERENCES visualisation (id) ON UPDATE CASCADE ON DELETE CASCADE,
    dataset_version_id text REFERENCES dataset_version_2 (id) ON UPDATE CASCADE ON DELETE CASCADE,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now(),
    UNIQUE (visualisation_id, dataset_version_id)
);

CREATE TABLE persisted_view_data_group (
    id text PRIMARY KEY,
    data_group_id text REFERENCES data_group (id) ON UPDATE CASCADE ON DELETE CASCADE,
    persisted_view_id text REFERENCES persisted_view (id) ON UPDATE CASCADE ON DELETE CASCADE,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now()
);


DO $$
BEGIN
    PERFORM tardis('persisted_view');
    PERFORM install_update_modified('persisted_view');
    PERFORM tardis('persisted_view_data_group');
    PERFORM install_update_modified('persisted_view_data_group');
END$$;
-- ;;
