#!/usr/bin/env bash

set -eu

function log {
   echo "$(date +"%T") - INFO - $*"
}

export PROJECT_NAME=akvo-lumen

if [[ "${TRAVIS_BRANCH}" != "develop" ]] && [[ "${TRAVIS_BRANCH}" != "master" ]]; then
    exit 0
fi

if [[ "${TRAVIS_PULL_REQUEST}" != "false" ]]; then
    exit 0
fi

log Making sure gcloud and kubectl are installed and up to date
gcloud components install kubectl
gcloud components update
gcloud version
which gcloud kubectl

log Authentication with gcloud and kubectl
openssl aes-256-cbc -K $encrypted_13abf95e958f_key -iv $encrypted_13abf95e958f_iv \
	-in ci/gcloud-service-account.json.enc -out ci/gcloud-service-account.json -d
gcloud auth activate-service-account --key-file ci/gcloud-service-account.json
gcloud config set project akvo-lumen
gcloud config set container/cluster europe-west1-d
gcloud config set compute/zone europe-west1-d
gcloud config set container/use_client_certificate True

if [[ "${TRAVIS_BRANCH}" == "master" ]]; then
    log Environment is production
    gcloud container clusters get-credentials production
else
    log Environement is test
    gcloud container clusters get-credentials test
fi

log Pushing images
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-backend
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-client
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-maps
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-exporter

log Finding blue/green state
LIVE_COLOR=$(./ci/live-color.sh)
log LIVE is "${LIVE_COLOR}"
DARK_COLOR=$(./ci/helpers/dark-color.sh "$LIVE_COLOR")

log "Deploying to dark ($DARK_COLOR)"
sed -e "s/\${BUILD_HASH}/$TRAVIS_COMMIT/" -e "s/\${COLOR}/${DARK_COLOR}/" ci/k8s/deployment.yaml.template > deployment.yaml

kubectl apply -f deployment.yaml
kubectl apply -f ci/k8s/redis-master-windshaft.yaml
kubectl apply -f ci/k8s/blue-green-gateway.yaml

if [[ "${TRAVIS_BRANCH}" = "master" ]]; then
    exit 0
fi

log Waiting for k8s to finish
./ci/helpers/wait-for-k8s-deployment-to-be-ready.sh "$DARK_COLOR"
log Waiting for k8s to be healthy
./ci/helpers/wait-for-k8s-deployment-to-be-healthy.sh

# log Running end to end tests against the Kubernetes TEST environment
# ./ci/e2e-test.sh akvolumenci https://dark-lumencitest.akvotest.org/ "$USERNAME" "$PASSWORD"
