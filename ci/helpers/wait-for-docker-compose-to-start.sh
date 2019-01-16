#!/usr/bin/env bash

MAX=30

BACKEND_TRIES=0
BACKEND=""
while [[ -z "${BACKEND}" && ${BACKEND_TRIES} -lt ${MAX} ]]; do
    echo "Waiting for backend to start ..."
    sleep 5
    BACKEND=$(docker-compose -p akvo-lumen-ci logs --no-color backend | grep "Registered web context" || echo "")
    (( BACKEND_TRIES=BACKEND_TRIES+1 ))
done

CLIENT_TRIES=0
CLIENT=""
while [[ -z "${CLIENT}" && ${CLIENT_TRIES} -lt ${MAX} ]]; do
    echo "Waiting for client to build ..."
    sleep 5
    CLIENT=$(docker-compose -p akvo-lumen-ci logs --no-color client | grep "webpack built" || echo "")
    (( CLIENT_TRIES=CLIENT_TRIES+1 ))
done