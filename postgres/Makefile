build:
	docker build -t akvo/lumen-db .

run:
	docker run -d --name lumen-db -p 5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=db -t akvo/lumen-db

go: build run

stop:
	docker stop lumen-db

rm:
	docker rm lumen-db

publish:
	docker push akvo/lumen-db:latest

clean: stop rm
