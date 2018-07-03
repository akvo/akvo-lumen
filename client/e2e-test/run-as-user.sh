#!/usr/bin/env bash

set -eu

NEW_UID=$(stat -c '%u' /app/Dockerfile)
NEW_GID=$(stat -c '%g' /app/Dockerfile)

if [ ${NEW_GID} -eq 0 ]; then
    /bin/bash
else
    groupmod -g "$NEW_GID" -o akvo >/dev/null 2>&1
    usermod -u "$NEW_UID" -o akvo >/dev/null 2>&1

    exec chpst -u akvo:akvo -U akvo:akvo env \
            HOME=/home/akvo \
            CYPRESS_LUMEN_URL=${LUMEN_URL} \
            CYPRESS_LUMEN_USER=${LUMEN_USER} \
            CYPRESS_LUMEN_PASSWORD=${LUMEN_PASSWORD} \
            "/app/run.sh"
fi