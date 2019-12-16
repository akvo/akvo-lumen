#!/usr/bin/env bash

set -eu

function log {
    echo "$(date +"%T") - INFO - $*"
}

if [ "$CI_DO_DEPLOYMENT" = true ]; then
    exit 0
fi

if [[ "${CI_TAG:-}" =~ promote-.* ]]; then
    log Environment is production
    gcloud container clusters get-credentials production
else
    log Environement is test
    gcloud container clusters get-credentials test

    log Pushing images
    # gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-backend
    # gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-client
    # gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-maps
    # gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-exporter
fi

log Finding blue/green state
LIVE_COLOR=$(./ci/live-color.sh)
log LIVE is "${LIVE_COLOR}"1
DARK_COLOR=$(./ci/helpers/dark-color.sh "$LIVE_COLOR")
