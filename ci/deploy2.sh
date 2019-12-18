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
    ENVIRONMENT=production
    BACKEND_POD_CPU_REQUESTS="200m"
    BACKEND_POD_CPU_LIMITS="400m"
    BACKEND_POD_MEM_REQUESTS="5Gi"
    BACKEND_POD_MEM_LIMITS="6Gi"
    CLIENT_POD_CPU_REQUESTS="100m"
    CLIENT_POD_CPU_LIMITS="200m"
    CLIENT_POD_MEM_REQUESTS="64Mi"
    CLIENT_POD_MEM_LIMITS="128Mi"
    MAPS_POD_CPU_REQUESTS="200m"
    MAPS_POD_CPU_LIMITS="300m"
    MAPS_POD_MEM_REQUESTS="512Mi"
    MAPS_POD_MEM_LIMITS="512Mi"
    EXPORTER_POD_CPU_REQUESTS="250m"
    EXPORTER_POD_CPU_LIMITS="500m"
    EXPORTER_POD_MEM_REQUESTS="256Mi"
    EXPORTER_POD_MEM_LIMITS="384Mi"
    REDIS_POD_CPU_REQUESTS="100m"
    REDIS_POD_CPU_LIMITS="200m"
    REDIS_POD_MEM_REQUESTS="16Mi"
    GW_POD_CPU_REQUESTS="100m"
    GW_POD_CPU_LIMITS="200m"
    GW_POD_MEM_REQUESTS="32Mi"
else
    log Environement is test
    gcloud container clusters get-credentials test
    BACKEND_POD_CPU_REQUESTS="100m"
    BACKEND_POD_CPU_LIMITS="200m"
    BACKEND_POD_MEM_REQUESTS="768Mi"
    BACKEND_POD_MEM_LIMITS="1024Mi"
    CLIENT_POD_CPU_REQUESTS="100m"
    CLIENT_POD_CPU_LIMITS="200m"
    CLIENT_POD_MEM_REQUESTS="32Mi"
    CLIENT_POD_MEM_LIMITS="64Mi"
    MAPS_POD_CPU_REQUESTS="100m"
    MAPS_POD_CPU_LIMITS="200m"
    MAPS_POD_MEM_REQUESTS="128Mi"
    MAPS_POD_MEM_LIMITS="256Mi"
    EXPORTER_POD_CPU_REQUESTS="200m"
    EXPORTER_POD_CPU_LIMITS="400m"
    EXPORTER_POD_MEM_REQUESTS="128Mi"
    EXPORTER_POD_MEM_LIMITS="256Mi"
    REDIS_POD_CPU_REQUESTS="50m"
    REDIS_POD_CPU_LIMITS="100m"
    REDIS_POD_MEM_REQUESTS="16Mi"
    GW_POD_CPU_REQUESTS="50m"
    GW_POD_CPU_LIMITS="100m"
    GW_POD_MEM_REQUESTS="32Mi"

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
sed -e "s/\${BUILD_HASH}/$CI_COMMIT/" \
    -e "s/\${COLOR}/${DARK_COLOR}/" \
    -e "s/\${ENVIRONMENT}/${ENVIRONMENT}/" \
    -e "s/\${BACKEND_POD_CPU_REQUESTS}/${BACKEND_POD_CPU_REQUESTS}/" \
    -e "s/\${BACKEND_POD_MEM_REQUESTS}/${BACKEND_POD_MEM_REQUESTS}/" \
    -e "s/\${BACKEND_POD_CPU_LIMITS}/${BACKEND_POD_CPU_LIMITS}/" \
    -e "s/\${BACKEND_POD_MEM_LIMITS}/${BACKEND_POD_MEM_LIMITS}/" \
    -e "s/\${CLIENT_POD_CPU_REQUESTS}/${CLIENT_POD_CPU_REQUESTS}/" \
    -e "s/\${CLIENT_POD_MEM_REQUESTS}/${CLIENT_POD_MEM_REQUESTS}/" \
    -e "s/\${CLIENT_POD_CPU_LIMITS}/${CLIENT_POD_CPU_LIMITS}/" \
    -e "s/\${CLIENT_POD_MEM_LIMITS}/${CLIENT_POD_MEM_LIMITS}/" \
    -e "s/\${MAPS_POD_CPU_REQUESTS}/${MAPS_POD_CPU_REQUESTS}/" \
    -e "s/\${MAPS_POD_MEM_REQUESTS}/${MAPS_POD_MEM_REQUESTS}/" \
    -e "s/\${MAPS_POD_CPU_LIMITS}/${MAPS_POD_CPU_LIMITS}/" \
    -e "s/\${MAPS_POD_MEM_LIMITS}/${MAPS_POD_MEM_LIMITS}/" \
    ci/k8s/deployment.yaml.template > deployment.yaml

kubectl apply -f deployment.yaml

sed -e "s/\${ENVIRONMENT}/${ENVIRONMENT}/" \
    -e "s/\${REDIS_POD_CPU_REQUESTS}/${REDIS_POD_CPU_REQUESTS}/" \
    -e "s/\${REDIS_POD_MEM_REQUESTS}/${REDIS_POD_MEM_REQUESTS}/" \
    -e "s/\${REDIS_POD_CPU_LIMITS}/${REDIS_POD_CPU_LIMITS}/" \
    ci/k8s/redis-master-windshaft.yaml.template > redis-master-windshaft.yaml

kubectl apply -f ci/k8s/redis-master-windshaft.yaml

sed -e "s/\${ENVIRONMENT}/${ENVIRONMENT}/" \
    -e "s/\${GW_POD_CPU_REQUESTS}/${GW_POD_CPU_REQUESTS}/" \
    -e "s/\${GW_POD_MEM_REQUESTS}/${GW_POD_MEM_REQUESTS}/" \
    -e "s/\${GW_POD_CPU_LIMITS}/${GW_POD_CPU_LIMITS}/" \
    ci/k8s/blue-green-gateway.yaml.template > blue-green-gateway.yaml

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
