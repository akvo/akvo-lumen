#!/usr/bin/env bash
set -eu

DB_HOST="localhost"
SUPER_USER="postgres"
NEW_USER=$1
NEW_USER_PASSWORD=$2
SUPER_USER_PASSWORD=

psql_settings=("--username=${SUPER_USER}" "--host=${DB_HOST}")

export PGPASSWORD="${SUPER_USER_PASSWORD}"

psql "${psql_settings[@]}" --command="CREATE USER ${NEW_USER} WITH ENCRYPTED PASSWORD '${NEW_USER_PASSWORD}';"
psql "${psql_settings[@]}" --command="GRANT ${NEW_USER} TO ${SUPER_USER};"

echo "----------"
echo "Done!"


