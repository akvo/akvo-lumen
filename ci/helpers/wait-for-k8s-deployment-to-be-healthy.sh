#!/usr/bin/env bash

starttime=$(date +%s)
healthz_check_url=$1

while [ $(( $(date +%s) - 60 )) -lt "${starttime}" ]; do

    if wget "$healthz_check_url" -O - -nv 2>/dev/null; then
        exit 0
    else
        echo "Waiting for the health check to pass"
        sleep 2
    fi
done

wget "$healthz_check_url" -O -

exit 1
