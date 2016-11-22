#!/usr/bin/env bash

set -e

CLI_ERR_MSG="Postgres CLI tools not available (psql). Using Postgres.app, look
at http://postgresapp.com/documentation/cli-tools.html. Aborting."
hash psql 2>/dev/null || { echo >&2 $CLI_ERR_MSG ; exit 1; }

# The following env vars are assumed to be present:
# PGHOST,  PGDATABASE, PGUSER, PGPASSWORD
# These can be found in the ElephantSQL console for the appropriate instance
# Use this as follow
# env PGHOST=****.db.elephantsql.com PGDATABASE=*** PGUSER=*** PGPASSWORD=*** ./tear-down.sh


psql -c "
     DROP EXTENSION IF EXISTS pgcrypto CASCADE;
     DROP EXTENSION IF EXISTS btree_gist CASCADE;
"

psql -c "DROP DATABASE IF EXISTS lumen"

psql -c "DROP ROLE IF EXISTS lumen"
