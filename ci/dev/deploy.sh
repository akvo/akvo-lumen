#!/usr/bin/env bash

set -e

export GOOGLE_APPLICATION_CREDENTIALS="/home/ubuntu/gcloud-service-key.json"
sudo /opt/google-cloud-sdk/bin/gcloud container clusters get-credentials ${DEV_CLUSTER_NAME} --zone europe-west1-d
sudo /opt/google-cloud-sdk/bin/gcloud config set container/use_client_certificate True

sudo /opt/google-cloud-sdk/bin/gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-backend
sudo /opt/google-cloud-sdk/bin/gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-client

sudo chown -R ubuntu:ubuntu /home/ubuntu/.kube

kubectl patch deployment lumen -p '{"spec":{"template":{"spec":{"containers":[{"name":"lumen-backend","image":"eu.gcr.io/akvo-lumen/lumen-backend:'"$CIRCLE_SHA1"'"},{"name":"lumen-client","image":"eu.gcr.io/akvo-lumen/lumen-client:'"$CIRCLE_SHA1"'"}]}}}}'
