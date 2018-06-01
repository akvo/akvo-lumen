#!/usr/bin/env bash

SCRIPT=${1:-script-test}
DOCKER_COMPOSE_PROJECT=${2:-akvolumen}
LUMEN_URL=${3:-http://t1.lumen.local:3030/}
LUMEN_USER=${4:-jerome}
LUMEN_PASSWORD=${5:-password}

docker build --rm=false -t akvo-lumen-e2e:develop client/e2e-test

docker run --interactive --tty --shm-size 1G --network="${DOCKER_COMPOSE_PROJECT}_default" \
       -e LUMEN_URL="${LUMEN_URL}" -e LUMEN_USER="${LUMEN_USER}" -e LUMEN_PASSWORD="${LUMEN_PASSWORD}" \
       --volume "$PWD/client/e2e-test":/app --link "akvo-lumen_client_1:t1.lumen.local" \
       --link "akvo-lumen_keycloak_1:auth.lumen.local" --sysctl net.ipv6.conf.all.disable_ipv6=1 \
       akvo-lumen-e2e:develop /bin/bash
       
