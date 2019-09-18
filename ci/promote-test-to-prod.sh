#!/usr/bin/env bash

set -u

function log {
   echo "$(date +"%T") - INFO - $*"
}

PREVIOUS_CONTEXT=$(kubectl config current-context)

function switch_back () {
    log "Switching k8s context back to ${PREVIOUS_CONTEXT}"
    kubectl config use-context "${PREVIOUS_CONTEXT}"
}

function set_cluster() {
    CLUSTER=$1
    log "running: gcloud container clusters get-credentials ${CLUSTER} --zone europe-west1-d --project akvo-lumen"
    if ! gcloud container clusters get-credentials "${CLUSTER}" --zone europe-west1-d --project akvo-lumen; then
        log "Could not change context to ${CLUSTER}. Nothing done."
        switch_back
        exit 3
    fi
}

function read_version () {
    COLOR=$1
    VERSION=$(kubectl get deployments lumen-$COLOR -o jsonpath="{@.spec.template.metadata.labels['lumen-version']}")
}

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

set_cluster "test"
TEST_LIVE_COLOR=$("${DIR}"/live-color.sh)

read_version "${TEST_LIVE_COLOR}"
TEST_LIVE_VERSION=$VERSION

set_cluster "production"
PROD_LIVE_COLOR=$("${DIR}"/live-color.sh)
PROD_DARK_COLOR=$("${DIR}"/helpers/dark-color.sh "${PROD_LIVE_COLOR}")
read_version "$PROD_LIVE_COLOR"
PROD_LIVE_VERSION=$VERSION
read_version "$PROD_DARK_COLOR"
PROD_DARK_VERSION=$VERSION

log "Deployed test version is $TEST_LIVE_VERSION"
log "Deployed prod dark version is $PROD_DARK_VERSION"
log "Deployed prod live version is $PROD_LIVE_VERSION"
log "Diff between test and dark prod is https://github.com/akvo/akvo-lumen/compare/$PROD_DARK_VERSION..$TEST_LIVE_VERSION"
log "Diff between test and live prod is https://github.com/akvo/akvo-lumen/compare/$PROD_LIVE_VERSION..$TEST_LIVE_VERSION"

TAG_NAME="promote-$(date +"%Y%m%d-%H%M%S")"

log "To deploy, run: "
echo "----------------------------------------------"
echo "git tag $TAG_NAME $TEST_LIVE_VERSION"
echo "git push origin $TAG_NAME"
echo "----------------------------------------------"

switch_back