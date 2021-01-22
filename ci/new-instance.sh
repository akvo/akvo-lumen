#!/usr/bin/env bash

set -eu

function log {
   echo "$(date +"%T") - INFO - $*"
}

read -r -p "Cluster (test or production): " CLUSTER

if [ -z "${CLUSTER}" ]; then
    log "Nothing typed"
    exit 2
fi

log "CLUSTER: $CLUSTER"

read -r -p "lumen url (should include https://):" URL

if [ -z "${URL}" ]; then
    log "Nothing typed"
    exit 2
fi

read -r -p "lumen organisation title:" ORGANISATION

if [ -z "${ORGANISATION}" ]; then
    log "Nothing typed"
    exit 2
fi

read -r -p "user email:" EMAIL

if [ -z "${EMAIL}" ]; then
    log "Nothing typed"
    exit 2
fi


log "URL: $URL"
log "ORGANISATION $ORGANISATION"
log "EMAIL $EMAIL"

gcloud container clusters get-credentials "$CLUSTER" --zone europe-west1-d --project akvo-lumen

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

CURRENT_LIVE_COLOR=$("${DIR}"/live-color.sh)

POD_NAME=$(kubectl get pods -l "run=lumen-blue-green,color=$CURRENT_LIVE_COLOR" -o jsonpath="{.items[0].metadata.name}")

log "POD $POD_NAME"

kubectl exec "$POD_NAME" -c lumen-backend -- java -cp akvo-lumen.jar clojure.main -m akvo.lumen.admin.add-tenant "$URL" "$ORGANISATION" "$EMAIL"
