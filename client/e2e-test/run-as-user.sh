#!/usr/bin/env bash

set -eu

NEW_UID=$(stat -c '%u' /app/Dockerfile)
NEW_GID=$(stat -c '%g' /app/Dockerfile)

if [ ${NEW_GID} -eq 0 ]; then
    /bin/bash
else
    groupmod -g "$NEW_GID" -o akvo >/dev/null 2>&1
    usermod -u "$NEW_UID" -o akvo >/dev/null 2>&1

    if [ -d "/home/akvo/.npm" ]; then
        chown akvo:akvo /home/akvo/.npm -R
    else
        mkdir /home/akvo/.npm
        chown akvo:akvo /home/akvo/.npm
    fi

    exec chpst -u akvo:akvo -U akvo:akvo env HOME=/home/akvo "/app/run.sh"
fi