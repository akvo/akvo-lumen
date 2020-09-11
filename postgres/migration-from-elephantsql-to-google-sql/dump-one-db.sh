#!/usr/bin/env bash

set -eu

DB_USER=
PASSWORD=
DB_NAME="${1}"
DUMP_FILE="${2}"
DB_HOST=
echo "Starting dump ..."

PGPASSWORD="${PASSWORD}" pg_dump --schema=history --host="${DB_HOST}" --username="${DB_USER}" --no-acl --no-owner "${DB_NAME}" | gzip > "history.${DUMP_FILE}"
PGPASSWORD="${PASSWORD}" pg_dump --schema=public --host="${DB_HOST}" --username="${DB_USER}" --no-acl --no-owner "${DB_NAME}" | gzip > "${DUMP_FILE}"