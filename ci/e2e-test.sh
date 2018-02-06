#!/usr/bin/env bash

SCRIPT=${1:-script-test}
DOCKER_COMPOSE_PROJECT=${2:-akvolumen}
LUMEN_URL=${3:-http://t1.lumen.local:3030/}
LUMEN_USER=${4:-jerome}
LUMEN_PASSWORD=${5:-password}

docker run --interactive --tty --shm-size 1G --network="${DOCKER_COMPOSE_PROJECT}_default" \
       -e LUMEN_URL="${LUMEN_URL}" -e LUMEN_USER="${LUMEN_USER}" -e LUMEN_PASSWORD="${LUMEN_PASSWORD}" \
       --volume "$PWD/client/e2e-test/${SCRIPT}.js":/app/index.js --link "${DOCKER_COMPOSE_PROJECT}_client_1:t1.lumen.local" \
       --link "${DOCKER_COMPOSE_PROJECT}_keycloak_1:auth.lumen.local" --sysctl net.ipv6.conf.all.disable_ipv6=1 alekzonder/puppeteer:0.13.0
