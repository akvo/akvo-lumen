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

deploy:
	kubectl create -f ./deployment.yaml

undeploy:
	kubectl delete -f ./deployment.yaml

expose:
	kubectl expose deployment lumen-deployment --type=NodePort

url:
	minikube service lumen-deployment --url
