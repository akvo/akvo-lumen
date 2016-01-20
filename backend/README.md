# Runway
Where Dash models live.


## Requirements
We use the Docker tool chain, docker, docker-machine & docker-compose needs to be available. Docs to get this exists at [docker.com](https://www.docker.com).


## Get started
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
