#!/usr/bin/env bash

set -eu

docker-compose up --no-color --build -d
MAX=30
TRIES=0
BACKEND=""
while [[ -z "${BACKEND}" && ${TRIES} -lt ${MAX} ]]; do
    echo "Waiting for backend to start ..."
    sleep 5
    BACKEND=$(docker-compose logs --no-color backend | grep "nREPL server started" || echo "")
    let TRIES=${TRIES}+1
done
TRIES=0
CLIENT=""
while [[ -z "${CLIENT}" && ${TRIES} -lt ${MAX} ]]; do
    echo "Waiting for client to start ..."
    sleep 5
    CLIENT=$(docker-compose logs --no-color client | grep "webpack: Compiled successfully" || echo "")
    let TRIES=${TRIES}+1
done

docker-compose exec client su-exec akvo npm run lint
docker-compose exec client su-exec akvo npm run test
docker-compose exec backend su-exec akvo lein do clean, check, test :all

docker run --interactive --tty --shm-size 1G --rm --network=akvolumen_default \
       --volume "$PWD/client/ui-test/script-test.js":/app/index.js --link akvolumen_client_1:t1.lumen.local \
       --link akvolumen_keycloak_1:auth.lumen.local --sysctl net.ipv6.conf.all.disable_ipv6=1 alekzonder/puppeteer:0.12.0
