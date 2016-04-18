#!/usr/bin/env bash

set -e

CLI_ERR_MSG="Postgres CLI tools not available (psql). Using Postgres.app, look
at http://postgresapp.com/documentation/cli-tools.html. Aborting."
hash psql 2>/dev/null || { echo >&2 $CLI_ERR_MSG ; exit 1; }

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR

# Setup Dash role
psql -c "CREATE ROLE dash WITH PASSWORD 'password' CREATEDB LOGIN;"

# Setup dash db
psql -f $DIR/helpers/create-dash.sql

# Setup Tardis
psql -d dash -f $DIR/helpers/tardis.sql

# Migrate dash db (to get tenants table)
# lein run -m 'user/migrate'
lein migrate

# Add tenants
$DIR/helpers/seed.sh

# Migrate tenants
# lein run -m 'user/migrate'
lein migrate

echo ""
echo "----------"
echo "Done!"
