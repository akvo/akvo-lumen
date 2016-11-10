#!/bin/env bash

set -e


sudo /opt/google-cloud-sdk/bin/gcloud docker push eu.gcr.io/${PROJECT_NAME}/lumen-backend
sudo /opt/google-cloud-sdk/bin/gcloud docker push eu.gcr.io/${PROJECT_NAME}/lumen-client

sudo chown -R ubuntu:ubuntu /home/ubuntu/.kube

kubectl patch deployment lumen-deployment -p '{"spec":{"template":{"spec":{"containers":[{"name":"lumen-backend","image":"eu.gcr.io/${PROJECT_NAME}/lumen-backend:'"$CIRCLE_SHA1"'"},{"name":"lumen-client","image":"eu.gcr.io/${PROJECT_NAME}/lumen-client:'"$CIRCLE_SHA1"'"}]}}}}'
