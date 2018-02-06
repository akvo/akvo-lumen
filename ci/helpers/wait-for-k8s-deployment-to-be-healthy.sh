#!/usr/bin/env bash

starttime=$(date +%s)

while [ $(( $(date +%s) - 60 )) -lt "${starttime}" ]; do

    if wget https://dark-lumencitest.akvotest.org/healthz -O - -nv; then
        exit 0
    else
        echo "Waiting for the health check to pass"
        sleep 2
    fi
done

wget https://dark-lumencitest.akvotest.org/healthz -O -

exit 1
