#!/usr/bin/env bash

SCRIPT=${1:-script-test}
DOCKER_COMPOSE_PROJECT=${2:-akvolumen}
LUMEN_URL=${3:-http://t1.lumen.local:3030/}
LUMEN_USER=${4:-jerome}
LUMEN_PASSWORD=${5:-password}

docker-compose run --no-deps fe-e2e-tests /app/run-as-user.sh
