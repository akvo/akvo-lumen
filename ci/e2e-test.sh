#!/usr/bin/env bash

DOCKER_COMPOSE_PROJECT=${1:-akvolumen}

docker run --interactive --tty --shm-size 1G --network=${DOCKER_COMPOSE_PROJECT}_default \
       --volume "$PWD/client/e2e-test/script-test.js":/app/index.js --link ${DOCKER_COMPOSE_PROJECT}_client_1:t1.lumen.local \
       --link ${DOCKER_COMPOSE_PROJECT}_keycloak_1:auth.lumen.local --sysctl net.ipv6.conf.all.disable_ipv6=1 alekzonder/puppeteer:0.13.0
