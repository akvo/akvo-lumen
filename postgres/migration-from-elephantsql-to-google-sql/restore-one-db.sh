#!/usr/bin/env bash

set -eu

DB_HOST=localhost
DB_USER=$1
NEW_USER_PASSWORD=$2
DB_NAME=$3
DUMP_FILE="${4}"

export PGPASSWORD="${NEW_USER_PASSWORD}"

psql_settings=("--username=${DB_USER}" "--host=${DB_HOST}" "--dbname=${DB_NAME}" "--set" "ON_ERROR_STOP=on")

gunzip --stdout "history.${DUMP_FILE}" \
  | sed -e "/ALTER DEFAULT PRIVILEGES FOR ROLE postgres/d" \
  | sed -e '/COPY public.spatial_ref_sys/,+2d' \
  | sed -e "/COPY public.spatial_ref_sys  FROM stdin/d" \
  | sed -e "/COMMENT ON SCHEMA history/d" \
  | sed -e "/CREATE SCHEMA history/d" \
  | psql "${psql_settings[@]}"

gunzip --stdout "${DUMP_FILE}" \
  | sed -e "/ALTER DEFAULT PRIVILEGES FOR ROLE postgres/d" \
  | sed -e '/COPY public.spatial_ref_sys/,+2d' \
  | sed -e "/COPY public.spatial_ref_sys  FROM stdin/d" \
  | sed -e "/COMMENT ON SCHEMA public/d" \
  | sed -e "/CREATE SCHEMA public/d" \
  | psql "${psql_settings[@]}"