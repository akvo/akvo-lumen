#!/usr/bin/env bash
set -eu

DB_HOST="localhost"
SUPER_USER="postgres"
NEW_USER=$1
NEW_DB_NAME=$2
SUPER_USER_PASSWORD=
LUMEN_MAIN_USER=

psql_settings=("--username=${SUPER_USER}" "--host=${DB_HOST}")

export PGPASSWORD="${SUPER_USER_PASSWORD}"

psql "${psql_settings[@]}" --command="DROP DATABASE IF EXISTS ${NEW_DB_NAME}"
psql "${psql_settings[@]}" --command="CREATE DATABASE ${NEW_DB_NAME} OWNER ${NEW_USER};"
psql "${psql_settings[@]}" --dbname="${NEW_DB_NAME}" --command="ALTER SCHEMA public OWNER TO ${NEW_USER};"
psql "${psql_settings[@]}" --dbname="${NEW_DB_NAME}" --command="CREATE SCHEMA history"
psql "${psql_settings[@]}" --dbname="${NEW_DB_NAME}" --command="ALTER SCHEMA history OWNER TO ${NEW_USER};"

psql "${psql_settings[@]}" --dbname="${NEW_DB_NAME}" --command="GRANT ALL PRIVILEGES ON DATABASE ${NEW_DB_NAME} TO ${LUMEN_MAIN_USER};";
psql "${psql_settings[@]}" --dbname="${NEW_DB_NAME}" --command="GRANT USAGE ON SCHEMA public TO ${LUMEN_MAIN_USER};"
psql "${psql_settings[@]}" --dbname="${NEW_DB_NAME}" --command="GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${LUMEN_MAIN_USER};"
psql "${psql_settings[@]}" --dbname="${NEW_DB_NAME}" --command="GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA history TO ${LUMEN_MAIN_USER};"
psql "${psql_settings[@]}" --dbname="${NEW_DB_NAME}" --command="GRANT USAGE ON SCHEMA history TO ${LUMEN_MAIN_USER};"


# Disable create objects and grant just to the db owner
psql "${psql_settings[@]}" --dbname="${NEW_DB_NAME}" --command="REVOKE CREATE ON SCHEMA public FROM public;"

EXTENSIONS="
  CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;
  CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
  CREATE EXTENSION IF NOT EXISTS tablefunc WITH SCHEMA public;
  CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;"

## Create extensions for dbs
psql "${psql_settings[@]}" --dbname="${NEW_DB_NAME}" --command "${EXTENSIONS}"

echo "----------"
echo "Done!"


