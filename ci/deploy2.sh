#!/usr/bin/env bash

set -eu

if [[ "$(./ci/helpers/should_deploy.sh)" == "false" ]] ; then
    exit 0
fi

function log {
    echo "$(date +"%T") - INFO - $*"
}

export PROJECT_NAME=akvo-lumen

if [[ "${CI_TAG:-}" =~ promote-.* ]]; then
    log Environment is production
    gcloud container clusters get-credentials production
else
    log Environement is test
    gcloud container clusters get-credentials test

    log Pushing images
    gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-backend
    gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-client
    gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-maps
    gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-exporter
fi

log Finding blue/green state
LIVE_COLOR=$(./ci/live-color.sh)
log LIVE is "${LIVE_COLOR}"1
DARK_COLOR=$(./ci/helpers/dark-color.sh "$LIVE_COLOR")

log "Deploying to dark ($DARK_COLOR)"
sed -e "s/\${BUILD_HASH}/$CI_COMMIT/" -e "s/\${COLOR}/${DARK_COLOR}/" ci/k8s/deployment.yaml.template > deployment.yaml

kubectl apply -f deployment.yaml
kubectl apply -f ci/k8s/redis-master-windshaft.yaml
kubectl apply -f ci/k8s/blue-green-gateway.yaml
kubectl apply -f ci/k8s/grafana/lumen-authz-allowed-paths.yml
kubectl apply -f ci/k8s/grafana/lumen.yml
kubectl apply -f ci/k8s/grafana/lumen-flow-api-authz.yml

log Waiting for k8s to finish
./ci/helpers/wait-for-k8s-deployment-to-be-ready.sh "$DARK_COLOR"

if [[ "${CI_TAG:-}" =~ promote-.* ]]; then
    log Waiting for k8s to be healthy
    ./ci/helpers/wait-for-k8s-deployment-to-be-healthy.sh https://dark-demo.akvolumen.org/healthz
else
    log Waiting for k8s to be healthy
    ./ci/helpers/wait-for-k8s-deployment-to-be-healthy.sh https://dark-lumencitest.akvotest.org/healthz

    log Running end to end tests against the Kubernetes TEST environment
    ./ci/e2e-test.sh akvolumenci auth0 https://dark-lumencitest.akvotest.org/ "$USERNAME" "$PASSWORD" "$AUTH_CLIENT" "$AUTH_PASSWORD"

    log Flipping TEST
    ./ci/auto-flip-test-blue-green-deployment.sh
fi
