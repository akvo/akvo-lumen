
# Runway
Where the Dash models live.


## Requirements
We use the Docker tool chain, docker, docker-machine & docker-compose needs to be available. Docs to get this exists at [docker.com](https://www.docker.com).


## Overview

```bash
.
├── Dockerfile
├── README.md
├── docker-compose.yml
├── manage.py
├── requirements.txt
└── runway
    ├── __init__.py
    ├── settings.py
    ├── ... 
```

## Run
To get the ip for the default docker machine issue:
```shell
$ docker-machine ip default
```

To run the app do:
```shell
$ docker-compose up
```
Now the Django app should be available at the docker ip's default ip on port 8000. ```