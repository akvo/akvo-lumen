# General
gcloud-auth:
	gcloud auth application-default login


# Dev

## Create dev cluster
cluster-dev:
	gcloud container clusters create dev-cluster --zone=europe-west1-d --machine-type=g1-small --num-nodes=1 --project=akvo-lumen

## Config kubectl
kube-dev-cred:
	gcloud container clusters get-credentials dev-cluster --zone europe-west1-d --project akvo-lumen

## Step 1
## From akvo-config/k8s add secrets lumen (& tls if not existinga)

## Step 2
ingress-dev:
	kubectl create -f ./ingress/dev.yaml

## Step 3
deploy-dev:
	kubectl create -f ./ci/deployment.yaml

## Step 4
expose-dev:
	kubectl expose deployment lumen --target-port=80 --type=NodePort

## Step 5
## Add firewall rule
# Copy ip from the default l7 rule + find tag from a VM instance under
# Compute Enigne -> VM Instances -> click on in correct cluster - find "tags"
# Add all ports from nodeports services as tcp:3....,3...


# Prod

## Create production cluster
cluster-prod:
	gcloud container clusters create lumen --zone=europe-west1-d --machine-type=g1-small --num-nodes=2 --project=akvo-lumen

# Config kubectl
kube-prod-cred:
	gcloud container clusters get-credentials lumen --zone europe-west1-d --project akvo-lumen

## Step 1
## From akvo-config/k8s add secrets lumen (& tls if not existinga)

## Step 2
ingress-prod:
	kubectl create -f ./ingress/prod.yaml

## Step 3
deploy-prod:
	kubectl create -f ./ci/deployment.yaml

## Step 4
expose-prod:
	kubectl expose deployment lumen --target-port=80 --type=NodePort

## Step 5
## Add firewall rule
# Copy ip from the default l7 rule + find tag from a VM instance under
# Compute Enigne -> VM Instances -> click on in correct cluster - find "tags"
# Add all ports from nodeports services as tcp:3....,3...


# Minikube - older
minikube-start:
	minikube start --vm-driver xhyve

minikube-status:
	minikube status

minikube-stop:
	minikube stop

build-client:
	docker build -t akvo/lumen-client client/

push-client:
	docker push akvo/lumen-client:latest

build-backend:
	docker build -t akvo/lumen-backend backend/

push-backend:
	docker push akvo/lumen-backend:latest

build: build-client build-backend

push: push-client push-backend

expose-local:
	kubectl expose deployment lumen --type=NodePort

url:
	minikube service lumen --url
