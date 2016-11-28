#!/usr/bin/env bash

set -e

CLI_ERR_MSG="Postgres CLI tools not available (psql). Using Postgres.app, look
at http://postgresapp.com/documentation/cli-tools.html. Aborting."
hash psql 2>/dev/null || { echo >&2 $CLI_ERR_MSG ; exit 1; }

LABEL=$1
TITLE=$2
TENANT=tenant_$LABEL
TENANT_PASSWORD=`openssl rand -base64 32 | tr -cd '[[:alnum:]]'`
DB_URI="jdbc:postgresql://$PGHOST/$TENANT?user=$TENANT&password=$TENANT_PASSWORD"


psql -c "CREATE ROLE $TENANT WITH PASSWORD '$TENANT_PASSWORD' LOGIN;"

psql -c "
        CREATE DATABASE $TENANT
        WITH OWNER = $TENANT
        TEMPLATE = template0
        ENCODING = 'UTF8'
        LC_COLLATE = 'en_US.UTF-8'
        LC_CTYPE = 'en_US.UTF-8';"

psql --dbname=$TENANT -c "
        CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;
        CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
"

psql -c "INSERT INTO tenants (db_uri, label, title) VALUES ('$DB_URI', '$LABEL', '$TITLE');"
