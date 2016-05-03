#!/usr/bin/env bash

set -e

CLI_ERR_MSG="Postgres CLI tools not available (psql). Using Postgres.app, look
at http://postgresapp.com/documentation/cli-tools.html. Aborting."
hash psql 2>/dev/null || { echo >&2 $CLI_ERR_MSG ; exit 1; }

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR


# Provision

## Create dash role
psql -c "CREATE ROLE dash WITH PASSWORD 'password' CREATEDB LOGIN;"

## Create dash dbs
psql -f $DIR/helpers/create-dash.sql

## Create extensions for dbs
psql -d dash -f $DIR/helpers/create-extensions.sql
psql -d test_dash -f $DIR/helpers/create-extensions.sql

## Create tenants dbs
psql -f $DIR/helpers/create-tenants.sql

## Create extensions for dbs
psql -d dash_tenant_1 -f $DIR/helpers/create-extensions.sql
psql -d dash_tenant_2 -f $DIR/helpers/create-extensions.sql
psql -d test_dash_tenant_1 -f $DIR/helpers/create-extensions.sql
psql -d test_dash_tenant_2 -f $DIR/helpers/create-extensions.sql


# Migrate, seed tenant manager with tenants & migrate added tenants
lein do migrate, seed, migrate


echo ""
echo "----------"
echo "Done!"
