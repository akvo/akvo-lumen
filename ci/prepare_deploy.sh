#!/usr/bin/env bash

set -eu

if [[ "$(./ci/helpers/should_deploy.sh)" == "false" ]] ; then
    exit 0
fi

function log {
    echo "$(date +"%T") - INFO - $*"
}

export PROJECT_NAME=akvo-lumen

log Authentication with gcloud and kubectl
gcloud auth activate-service-account --key-file=/home/semaphore/.secrets/gcp.json
gcloud config set project akvo-lumen
gcloud config set container/cluster europe-west1-d
gcloud config set compute/zone europe-west1-d
gcloud config set container/use_client_certificate False
