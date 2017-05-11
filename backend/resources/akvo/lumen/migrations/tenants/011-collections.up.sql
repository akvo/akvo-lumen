CREATE TABLE collection (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title text UNIQUE NOT NULL CONSTRAINT text_length CHECK (
        char_length(title) > 0 AND
	char_length(title) < 128
    ),
    created timestamptz DEFAULT now() NOT NULL,
    modified timestamptz DEFAULT now() NOT NULL
);
--;;

DO $$
BEGIN
    PERFORM tardis('collection');
    PERFORM install_update_modified('collection');
END$$;

CREATE TABLE collection_entity (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    collection_id text NOT NULL REFERENCES collection (id) ON UPDATE CASCADE ON DELETE CASCADE,
    dataset_id text REFERENCES dataset (id) ON UPDATE CASCADE ON DELETE CASCADE,
    visualisation_id text REFERENCES visualisation (id) ON UPDATE CASCADE ON DELETE CASCADE,
    dashboard_id text REFERENCES dashboard (id) ON UPDATE CASCADE ON DELETE CASCADE,
    created timestamptz DEFAULT now() NOT NULL,
    modified timestamptz DEFAULT now() NOT NULL,
    UNIQUE (collection_id, dataset_id),
    UNIQUE (collection_id, visualisation_id),
    UNIQUE (collection_id, dashboard_id),
    CONSTRAINT one_entity CHECK (
        (CASE WHEN dataset_id IS NULL THEN 0 ELSE 1 END) +
        (CASE WHEN visualisation_id IS NULL THEN 0 ELSE 1 END) +
        (CASE WHEN dashboard_id IS NULL THEN 0 ELSE 1 END) = 1
    )
);

DO $$
BEGIN
    PERFORM tardis('collection_entity');
    PERFORM install_update_modified('collection_entity');
END$$;
