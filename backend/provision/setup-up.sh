#!/usr/bin/env bash

set -e

CLI_ERR_MSG="Postgres CLI tools not available (psql). Using Postgres.app, look at http://postgresapp.com/documentation/cli-tools.html. Aborting."
hash psql 2>/dev/null || { echo >&2 $CLI_ERR_MSG ; exit 1; }

# Postgres
psql -c "CREATE ROLE dash WITH PASSWORD 'password' CREATEDB LOGIN;"

psql -c "
CREATE DATABASE dash
OWNER dash
ENCODING 'UTF8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8'
TEMPLATE template0;"


echo ""
echo "----------"
echo "Done!"


# Notes

# One role to all tenants or should we have a role per tenant?
# Maybe it's most logical to view roles as part of the database, and
# give that also isolation.
# psql -c "CREATE ROLE dash_user WITH PASSWORD 'password' LOGIN"
# Setup Dash lord db
# http://www.postgresql.org/docs/current/interactive/locale.html
# http://www.postgresql.org/docs/current/interactive/collation.html
# In the future change template_1 since we might create other dbs?

# http://stackoverflow.com/questions/18389124/simulate-create-database-if-not-exists-for-postgresql
