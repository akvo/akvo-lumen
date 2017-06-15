#!/usr/bin/env bash

set -e

CLI_ERR_MSG="Postgres CLI tools not available (psql). Using Postgres.app, look
at http://postgresapp.com/documentation/cli-tools.html. Aborting."
hash psql 2>/dev/null || { echo >&2 $CLI_ERR_MSG ; exit 1; }

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR


# Provision

## Create lumen role
psql -c "CREATE ROLE lumen WITH PASSWORD 'password' CREATEDB LOGIN;"

## Create lumen dbs
psql -f $DIR/helpers/create-lumen.sql

## Create extensions for dbs
psql -d lumen -f $DIR/helpers/create-extensions.sql
psql -d test_lumen -f $DIR/helpers/create-extensions.sql

## Create tenants dbs
psql -f $DIR/helpers/create-tenants.sql

## Create extensions for dbs
psql -d lumen_tenant_1 -f $DIR/helpers/create-extensions.sql
psql -d lumen_tenant_2 -f $DIR/helpers/create-extensions.sql
psql -d test_lumen_tenant_1 -f $DIR/helpers/create-extensions.sql
psql -d test_lumen_tenant_2 -f $DIR/helpers/create-extensions.sql


# Migrate, seed tenant manager with tenants & migrate added tenants
# lein do migrate, seed, migrate
lein trampoline do migrate, seed, migrate


echo ""
echo "----------"
echo "Done!"
