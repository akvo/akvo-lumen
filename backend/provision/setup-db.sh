#!/usr/bin/env bash

set -e

hash createdb 2>/dev/null || { echo >&2 "createdb is not available. Using Postgres.app? Then look at http://postgresapp.com/documentation/cli-tools.html. Aborting."; exit 1; }

echo "yay"
