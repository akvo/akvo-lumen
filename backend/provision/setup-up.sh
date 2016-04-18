#!/usr/bin/env bash

set -e

CLI_ERR_MSG="Postgres CLI tools not available (psql). Using Postgres.app, look at http://postgresapp.com/documentation/cli-tools.html. Aborting."
hash psql 2>/dev/null || { echo >&2 $CLI_ERR_MSG ; exit 1; }

# Postgres
psql -c "CREATE ROLE dash WITH PASSWORD 'password' CREATEDB LOGIN;"

# Development DB
psql -c "
CREATE DATABASE dash
OWNER dash
TEMPLATE template0;
"

psql -d dash -c "
CREATE EXTENSION IF NOT EXISTS hstore;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
"

# TODO: check postgres unsafe mode
# Test DB
psql -c "
CREATE DATABASE dash_test
OWNER dash
TEMPLATE template0;
"

psql -d dash_test -c "
CREATE EXTENSION IF NOT EXISTS hstore;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
"

echo ""
echo "----------"
echo "Done!"
