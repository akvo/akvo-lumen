#!/usr/bin/env bash

starttime=$(date +%s)

while [ $(( $(date +%s) - 120 )) -lt "${starttime}" ]; do

    if wget http://t1.lumen.local/ -O - -nv; then
        exit 0
    else
        echo "Waiting for the client to start..."
        sleep 5
    fi
done

exit 1  