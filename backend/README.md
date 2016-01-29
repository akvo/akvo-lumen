# Runway
Where Dash models live.


## Requirements
We use the Docker tool chain, docker, docker-machine & docker-compose needs to be available. Docs to get this exists at [docker.com](https://www.docker.com).


## Get started
Create a development env var file, this is so we don't have to pass in env vars every time we run our development environment.
```shell
$ touch runway/.env
```
Add development settings:
```shell
DEBUG=on
DATABASE_URL=psql://postgres:postgres@db:5432/postgres
SECRET_KEY=zig9s!trkt1(@adhol_9-!d#cm52(begsp2!=-dp(gbbj^j3nm
```

To get the ip for the default docker machine:

```shell
$ docker-machine ip default
```

To run the container for development:
```shell
$ docker-compose up
```
Now the Django app should be available at the docker ip's default ip on port 8000.


## How to Django

The project was created with:
```shell
$ docker-compose run web django-admin.py startproject runway .
```

To create a new app on the container:
```shell
$ docker-compose run web ./manage.py startapp polls
```

Docker compose have commands liks ps, stop, start to control the lifecycle of the system.


## Production
For production we can run the Django app with Gunicorn.

```shell
$ docker-compose -f docker-compose.prod.yml up
```
