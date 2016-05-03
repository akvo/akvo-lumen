CREATE TABLE IF NOT EXISTS tenants (
    id serial,
    db_uri text,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    label text UNIQUE,
    title text
);

DO $$
BEGIN
    PERFORM tardis('tenants');
END$$;
-- ;;
