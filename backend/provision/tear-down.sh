#!/usr/bin/env bash

set -e

CLI_ERR_MSG="Postgres CLI tools not available (psql). Using Postgres.app, look at http://postgresapp.com/documentation/cli-tools.html. Aborting."
hash psql 2>/dev/null || { echo >&2 $CLI_ERR_MSG ; exit 1; }

# Postgres
psql -c "DROP DATABASE IF EXISTS dash;"
psql -c "DROP USER IF EXISTS dash;"

echo ""
echo "----------"
echo "Done!"
