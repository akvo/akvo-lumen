#!/usr/bin/env bash

set -eu

function log {
   echo "`date +"%T"` - INFO - $@"
}

export PROJECT_NAME=akvo-lumen

if [[ "${TRAVIS_BRANCH}" != "issue-1243/k8s-tests" ]] && [[ "${TRAVIS_BRANCH}" != "master" ]]; then
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
gcloud auth activate-service-account --key-file ci/gcloud-service-account.json
gcloud config set project akvo-lumen
gcloud config set container/cluster europe-west1-d
gcloud config set compute/zone europe-west1-d
gcloud config set container/use_client_certificate True

if [[ "${TRAVIS_BRANCH}" == "master" ]]; then
    log Environment is production
    gcloud container clusters get-credentials lumen
else
    log Environement is test
    gcloud container clusters get-credentials test
fi

log Pushing images
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-backend
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-client
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-maps

log Deploying
sed -e "s/\${BUILD_HASH}/$TRAVIS_COMMIT/" ci/deployment.yaml.template > deployment.yaml

kubectl apply -f deployment.yaml
kubectl apply -f ci/redis-master-windshaft.yaml

log Waiting for k8s to finish
./ci/wait-for-k8s-deployment-to-be-ready.sh

log Running end to end tests
./ci/e2e-test.sh script-test.js akvolumenci http://t1.lumen.local/ $USERNAME $PASSWORD
log Cleaning up environment
./ci/e2e-test.sh clean-all.js akvolumenci http://t1.lumen.local/ $USERNAME $PASSWORD