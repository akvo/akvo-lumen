#!/usr/bin/env bash

set -e

CLI_ERR_MSG="Postgres CLI tools not available (psql). Using Postgres.app, look
at http://postgresapp.com/documentation/cli-tools.html. Aborting."
hash psql 2>/dev/null || { echo >&2 $CLI_ERR_MSG ; exit 1; }

# The following env vars are assumed to be present:
# PGHOST,  PGDATABASE, PGUSER, PGPASSWORD
# These can be found in the ElephantSQL console for the appropriate instance
# Use this as follow
# env PGHOST=****.db.elephantsql.com PGDATABASE=*** PGUSER=*** PGPASSWORD=*** ./setup-db.sh


psql -c "CREATE ROLE lumen WITH PASSWORD '$PGPASSWORD' CREATEDB LOGIN;"

psql -c "
        CREATE DATABASE lumen
        WITH OWNER = lumen
        TEMPLATE = template0
        ENCODING = 'UTF8'
        LC_COLLATE = 'en_US.UTF-8'
        LC_CTYPE = 'en_US.UTF-8';"

psql --dbname=lumen -c "
        CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;
        CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
"
