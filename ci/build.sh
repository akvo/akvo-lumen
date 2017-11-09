#!/usr/bin/env bash

set -eu

docker-compose up --no-color --build

BACKEND=""
while [ -z "${BACKEND}" ] ; do
    echo "Waiting for backend to start ..."
    sleep 5
    BACKEND=$(docker-compose logs --no-color backend | grep "nREPL server started" || echo "")
done

CLIENT=""
while [ -z "${CLIENT}" ] ; do
    echo "Waiting for client to start ..."
    sleep 5
    CLIENT=$(docker-compose logs --no-color client | grep "webpack: Compiled successfully" || echo "")
done

docker run --interactive --tty --shm-size 1G --rm --network=akvolumen_default \
       --volume "$PWD/client/ui-test/script-test.js":/app/index.js --link akvolumen_client_1:t1.lumen.local \
       --link akvolumen_keycloak_1:auth.lumen.local --link akvolumen_client_1:t1.lumen.local \
       --link akvolumen_keycloak_1:auth.lumen.local --sysctl net.ipv6.conf.all.disable_ipv6=1 alekzonder/puppeteer:0.12.0
