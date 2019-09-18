#!/usr/bin/env bash

set -u

function log {
   echo "$(date +"%T") - INFO - $*"
}

CLUSTER="test"

log "Reading blue/green status of ${CLUSTER}"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

CURRENT_LIVE_COLOR=$("${DIR}"/live-color.sh)
log "Current LIVE is $CURRENT_LIVE_COLOR"

if ! NEW_LIVE_COLOR=$("${DIR}"/helpers/dark-color.sh "${CURRENT_LIVE_COLOR}"); then
    log "Something is wrong with the colors"
    exit 4
fi

if ! "${DIR}"/set-live-deployment.sh "${NEW_LIVE_COLOR}"; then
    log "Something went wrong with applying the switch."
    log "PLEASE CHECK WHAT HAPPEN!!!!!!!!!!!!!"
    exit 5
fi