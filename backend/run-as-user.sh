#!/usr/bin/env bash

set -o nounset
set -o errexit

host_uid=$(stat -c '%u' /app)
host_gid=$(stat -c '%g' /app)

groupmod -g "${host_uid}" -o akvo > /dev/null 2>&1
usermod -u "${host_gid}" -o akvo > /dev/null 2>&1

exec chpst -u akvo:akvo -U akvo:akvo env HOME="/home/akvo" "$@"
