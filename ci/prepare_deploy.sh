#!/usr/bin/env bash

set -eu

function log {
    echo "$(date +"%T") - INFO - $*"
}

export PROJECT_NAME=akvo-lumen

export CI_DO_DEPLOYMENT=true

if [[ "${CI_BRANCH}" != "issue/2439-sem-deploy2" ]] && [[ ! "${CI_TAG:-}" =~ promote-.* ]]; then
    EXPORT CI_DO_DEPLOYMENT=false
fi

if [[ "${CI_PULL_REQUEST}" != "false" ]]; then
    EXPORT CI_DO_DEPLOYMENT=false
fi

echo $CI_DO_DEPLOYMENT

if [ "$CI_DO_DEPLOYMENT" = true ]; then
    exit 0
fi

log Authentication with gcloud and kubectl
gcloud auth activate-service-account --key-file=/home/semaphore/.secrets/gcp.json
gcloud config set project akvo-lumen
gcloud config set container/cluster europe-west1-d
gcloud config set compute/zone europe-west1-d
gcloud config set container/use_client_certificate False
