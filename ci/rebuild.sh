#!/usr/bin/env bash

set -e

BRANCH_NAME="${TRAVIS_BRANCH:=unknown}"
export PROJECT_NAME=akvo-lumen

if [ -z "$TRAVIS_COMMIT" ]; then
    export TRAVIS_COMMIT=local
fi

docker build --rm=false -t akvo-lumen-dev:develop backend -f backend/Dockerfile-dev
docker run --env-file=.env -v $HOME/.m2:/home/akvo/.m2 -v `pwd`/backend:/app akvo-lumen-dev:develop /app/run-as-user.sh lein do test, uberjar

cp backend/target/uberjar/akvo-lumen.jar backend

docker build --rm=false -t eu.gcr.io/${PROJECT_NAME}/lumen-backend:${TRAVIS_COMMIT} ./backend
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-backend:${TRAVIS_COMMIT} eu.gcr.io/${PROJECT_NAME}/lumen-backend:develop

docker build --rm=false -t eu.gcr.io/${PROJECT_NAME}/lumen-client:${TRAVIS_COMMIT} ./client
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-client:${TRAVIS_COMMIT} eu.gcr.io/${PROJECT_NAME}/lumen-client:develop

docker build --rm=false -t eu.gcr.io/${PROJECT_NAME}/lumen-maps:${TRAVIS_COMMIT} ./windshaft
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-maps:${TRAVIS_COMMIT} eu.gcr.io/${PROJECT_NAME}/lumen-maps:develop
