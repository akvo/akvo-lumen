CREATE TABLE dataset_column (
    id text PRIMARY KEY,
    dataset_id text REFERENCES dataset,
    title text NOT NULL,
    type text NOT NULL,
    -- The name of the column in the data table
    column_name text NOT NULL,
    column_order smallint NOT NULL,
    sort smallint,
    direction char(1),
    hidden boolean,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now()
);

DO $$
BEGIN
    PERFORM tardis('dataset_column');
END$$;
-- ;;
