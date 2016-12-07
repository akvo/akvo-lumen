#!/usr/bin/env bash

set -e


psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE ROLE lumen WITH PASSWORD 'password' CREATEDB LOGIN;

    CREATE DATABASE lumen
    WITH OWNER = lumen
         TEMPLATE = template0
         ENCODING = 'UTF8'
         LC_COLLATE = 'en_US.UTF-8'
         LC_CTYPE = 'en_US.UTF-8';

    GRANT ALL PRIVILEGES ON DATABASE lumen TO lumen;

    CREATE DATABASE test_lumen
    WITH OWNER = lumen
         TEMPLATE = template0
         ENCODING = 'UTF8'
         LC_COLLATE = 'en_US.UTF-8'
         LC_CTYPE = 'en_US.UTF-8';

    GRANT ALL PRIVILEGES ON DATABASE test_lumen TO lumen;

EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d lumen <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d test_lumen <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
EOSQL
