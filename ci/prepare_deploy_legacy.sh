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
openssl aes-256-cbc -K $encrypted_13abf95e958f_key -iv $encrypted_13abf95e958f_iv \
	-in ci/gcloud-service-account.json.enc -out ci/gcloud-service-account.json -d
gcloud auth activate-service-account --key-file ci/gcloud-service-account.json
gcloud config set project akvo-lumen
gcloud config set container/cluster europe-west1-d
gcloud config set compute/zone europe-west1-d
gcloud config set container/use_client_certificate True
