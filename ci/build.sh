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

./ci/e2e-test.sh
