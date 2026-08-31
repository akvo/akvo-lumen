#!/usr/bin/env bash

starttime=$(date +%s)
healthz_check_url=$1

# Matches the 300s that wait-for-k8s-deployment-to-be-ready.sh allows. The two
# ran to different budgets, so a deploy could clear the readiness wait and then
# be failed here by a load balancer health check that had not caught up yet.
while [ $(( $(date +%s) - 300 )) -lt "${starttime}" ]; do

    if wget "$healthz_check_url" -O - -nv 2>/dev/null; then
        exit 0
    else
        echo "Waiting for the health check to pass"
        sleep 2
    fi
done

wget "$healthz_check_url" -O -

exit 1
