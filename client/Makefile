minikube-start:
	minikube start --vm-driver xhyve

minikube-status:
	minikube status

minikube-stop:
	minikube stop

build:
	docker build -t akvo/lumen-client .

push:
	docker push akvo/lumen-client:latest

deploy:
	kubectl create -f ./deployment.yaml

undeploy:
	kubectl delete -f ./deployment.yaml

expose:
	kubectl expose deployment lumen-deployment --type=NodePort

url:
	minikube service lumen-deployment --url
