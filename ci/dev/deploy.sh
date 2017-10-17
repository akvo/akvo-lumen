#!/usr/bin/env bash

set -e

export GOOGLE_APPLICATION_CREDENTIALS="/home/ubuntu/gcloud-service-key.json"
sudo /opt/google-cloud-sdk/bin/gcloud container clusters get-credentials ${DEV_CLUSTER_NAME} --zone europe-west1-d
sudo /opt/google-cloud-sdk/bin/gcloud config set container/use_client_certificate True

sudo /opt/google-cloud-sdk/bin/gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-backend
sudo /opt/google-cloud-sdk/bin/gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-client
sudo /opt/google-cloud-sdk/bin/gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-maps

sudo chown -R ubuntu:ubuntu /home/ubuntu/.kube

sed -e "s/\${BUILD_HASH}/$CIRCLE_SHA1/" ci/deployment.yaml.template > deployment.yaml
# This is to avoid deploying maps into production until it is ready.
# Move this to the deployment.yaml.template once we want to deploy to prod.
cat <<EOF >> deployment.yaml
      - name: lumen-maps
        image: eu.gcr.io/akvo-lumen/lumen-maps:\${BUILD_HASH}
        ports:
        - containerPort: 4000
        resources:
          requests:
            cpu: "50m"
          limits:
            cpu: "1000m"
        env:
        - name: LUMEN_ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: lumen
              key: encryption_key
EOF
sed "s/\${BUILD_HASH}/$CIRCLE_SHA1/" -i deployment.yaml

kubectl apply -f deployment.yaml
kubectl apply -f ci/redis-master-windshaft.yaml
