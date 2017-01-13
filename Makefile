# Local
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

# Prod
kube-prod-cred:
	gcloud container clusters get-credentials lumen --zone europe-west1-d --project akvo-lumen

## Step 1
cluster-prod:
	gcloud container clusters create lumen --zone=europe-west1-d --machine-type=g1-small --num-nodes=2 --project=akvo-lumen

## Step 2 add secrets to cluster, can be found in akvo-config

## Step 3 Make sure there is an ingress object
ingress-prod:
	kubectl create -f ./ingress/prod.yaml

## Step 3
deploy-prod:
	kubectl create -f ./ci/deployment.yaml

## Step 4
service-prod:
	kubectl create -f ./ci/service.yaml

# Dev
cluster-dev:
	gcloud container clusters create lumen-dev --zone=europe-west1-d --machine-type=g1-small --num-nodes=1 --project=akvo-lumen

kube-dev-cred:
	gcloud container clusters get-credentials lumen-dev --zone europe-west1-d --project akvo-lumen

gcloud-auth:
	gcloud auth application-default login

ingress-dev:
	kubectl create -f ./ingress/dev.yaml

deploy-dev:
	kubectl create -f ./ci/deployment.yaml

expose-dev:
	kubectl expose deployment lumen --target-port=80 --type=NodePort

# service-dev:
# 	kubectl create -f ./ci/service.yaml

# expose-dev:
# 	kubectl expose deployment lumen --type="LoadBalancer" --target-port=80 --load-balancer-ip='104.199.71.250'
