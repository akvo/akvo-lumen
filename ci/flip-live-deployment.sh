#!/usr/bin/env bash

set -u

function log {
   echo "$(date +"%T") - INFO - $*"
}

read -r -p "Probably is either test or lumen (for production): " CLUSTER

if [ "${CLUSTER}" == "lumen" ]; then
 read -r -e -p "Are you sure you want to flip production? [yn] " CONFIRM
 if [ "${CONFIRM}" != "y" ]; then
    log "Nothing done"
    exit 1
 fi
elif [ -z "${CLUSTER}" ]; then
    log "Nothing typed"
    exit 2
fi

PREVIOUS_CONTEXT=$(kubectl config current-context)

function switch_back () {
    log "Switching k8s context back to ${PREVIOUS_CONTEXT}"
    kubectl config use-context "${PREVIOUS_CONTEXT}"
}

log "running: gcloud container clusters get-credentials ${CLUSTER} --zone europe-west1-d --project akvo-lumen"
if ! gcloud container clusters get-credentials "${CLUSTER}" --zone europe-west1-d --project akvo-lumen; then
    log "Could not change context to ${CLUSTER}. Nothing done."
    exit 3
fi

log "Reading blue/green status of ${CLUSTER}"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

CURRENT_LIVE_COLOR=$("${DIR}"/live-color.sh)
log "Current LIVE is $CURRENT_LIVE_COLOR"

if ! NEW_LIVE_COLOR=$("${DIR}"/helpers/dark-color.sh "${CURRENT_LIVE_COLOR}"); then
    log "Something is wrong with the colors"
    switch_back
    exit 4
fi

if ! "${DIR}"/set-live-deployment.sh "${NEW_LIVE_COLOR}"; then
    log "Something went wrong with applying the switch."
    log "PLEASE CHECK WHAT HAPPEN!!!!!!!!!!!!!"
    switch_back
    exit 5
fi

switch_back