#!/usr/bin/env bash

set -eu

export PROJECT_NAME=akvo-lumen

if [[ "${TRAVIS_BRANCH}" != "develop" ]] && [[ "${TRAVIS_BRANCH}" != "master" ]]; then
    exit 0
fi

if [[ "${TRAVIS_PULL_REQUEST}" != "false" ]]; then
    exit 0
fi

# Making sure gcloud and kubectl are installed and up to date
gcloud components install kubectl
gcloud components update
gcloud version
which gcloud kubectl

# Authentication with gcloud and kubectl
gcloud auth activate-service-account --key-file ci/gcloud-service-account.json
gcloud config set project akvo-lumen
gcloud config set container/cluster europe-west1-d
gcloud config set compute/zone europe-west1-d
gcloud config set container/use_client_certificate True

if [[ "${TRAVIS_BRANCH}" == "master" ]]; then
    gcloud container clusters get-credentials lumen
else
    gcloud container clusters get-credentials test
fi

# Pushing images
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-backend
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-client
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-maps

# Deploying
sed -e "s/\${BUILD_HASH}/$TRAVIS_COMMIT/" ci/deployment.yaml.template > deployment.yaml

kubectl apply -f deployment.yaml
kubectl apply -f ci/redis-master-windshaft.yaml

./ci/wait-for-k8s-deployment-to-be-ready.sh

./ci/e2e-test.sh script-test.js akvolumenci http://t1.lumen.local/ $USERNAME $PASSWORD
./ci/e2e-test.sh clean-all.js akvolumenci http://t1.lumen.local/ $USERNAME $PASSWORD