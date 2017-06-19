#!/usr/bin/env bash

set -e

export GOOGLE_APPLICATION_CREDENTIALS="/home/ubuntu/gcloud-service-key.json"
sudo /opt/google-cloud-sdk/bin/gcloud container clusters get-credentials ${DEV_CLUSTER_NAME} --zone europe-west1-d
sudo /opt/google-cloud-sdk/bin/gcloud config set container/use_client_certificate True

sudo /opt/google-cloud-sdk/bin/gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-backend
sudo /opt/google-cloud-sdk/bin/gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-client

sudo chown -R ubuntu:ubuntu /home/ubuntu/.kube

sed -e "s/\${BUILD_HASH}/$CIRCLE_SHA1/" ci/deployment.yaml.template > deployment.yaml

kubectl apply -f deployment.yaml
