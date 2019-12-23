#!/usr/bin/env bash

COLOR=$1

starttime=$(date +%s)

while [ $(( $(date +%s) - 300 )) -lt "${starttime}" ]; do

   lumen_status=$(kubectl get pods -l "lumen-version=$CI_COMMIT,run=lumen-blue-green,color=${COLOR}" -o jsonpath='{range .items[*].status.containerStatuses[*]}{@.name}{" ready="}{@.ready}{"\n"}{end}')
# We want to make sure that when we hit the ingress from the integration test, we are hitting the new containers,
# hence we wait until the old pods are gone.
# Another possibility could be to check that the service is pointing just to the new containers.
   old_lumen_status=$(kubectl get pods -l "lumen-version!=$CI_COMMIT,run=lumen-blue-green,color=${COLOR}" -o jsonpath='{range .items[*].status.containerStatuses[*]}{@.name}{" ready="}{@.ready}{"\n"}{end}')

    if [[ ${lumen_status} =~ "ready=true" ]] && ! [[ ${lumen_status} =~ "ready=false" ]] && ! [[ ${old_lumen_status} =~ "ready" ]] ; then
        echo "all good!"
        exit 0
    else
        echo "Waiting for the containers to be ready"
        sleep 10
    fi
done

echo "Containers not ready after 5 minutes or old containers not stopped"

kubectl get pods -l "color=${COLOR},run=lumen-blue-green" -o jsonpath='{range .items[*].status.containerStatuses[*]}{@.name}{" ready="}{@.ready}{"\n"}{end}'

exit 1
