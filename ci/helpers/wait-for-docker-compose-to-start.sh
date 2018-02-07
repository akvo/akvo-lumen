#!/usr/bin/env bash

MAX=30
TRIES=0
BACKEND=""
while [[ -z "${BACKEND}" && ${TRIES} -lt ${MAX} ]]; do
    echo "Waiting for backend to start ..."
    sleep 5
    BACKEND=$(docker-compose -p akvo-lumen-ci logs --no-color backend | grep "Registered web context" || echo "")
    (( TRIES=TRIES+1 ))
done