#!/usr/bin/env bash
# shellcheck disable=SC1010

set -eu

function log {
   echo "$(date +"%T") - INFO - $*"
}

export PROJECT_NAME=akvo-lumen

if [ -z "$TRAVIS_COMMIT" ]; then
    export TRAVIS_COMMIT=local
fi

if [[ "${TRAVIS_TAG:-}" =~ promote-.* ]]; then
    log "Skipping build as it is a prod promotion"
    exit 0
fi

log Running Backend unit tests and building uberjar
backend_image_version=$(awk -F':' '/backend-dev/ {print $3}' docker-compose.override.yml)
docker run -v "$HOME/.m2:/home/akvo/.m2" -v "$(pwd)/backend:/app" "akvo/akvo-lumen-backend-dev:${backend_image_version}" run-as-user.sh lein do test, eastwood, uberjar

cp backend/target/uberjar/akvo-lumen.jar backend

log Creating Production Backend image
docker build --quiet --rm=false -t eu.gcr.io/${PROJECT_NAME}/lumen-backend:${TRAVIS_COMMIT} ./backend
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-backend:${TRAVIS_COMMIT} eu.gcr.io/${PROJECT_NAME}/lumen-backend:develop

log Running Client linting, unit tests and creating production assets
client_image_version=$(awk -F':' '/client-dev/ {print $3}' docker-compose.yml)
docker run -v "$(pwd)/client:/lumen" --rm=false -t "akvo/akvo-lumen-client-dev:${client_image_version}" ./ci-build.sh

log Creating Production Client image
docker build --quiet --rm=false -t eu.gcr.io/${PROJECT_NAME}/lumen-client:${TRAVIS_COMMIT} ./client
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-client:${TRAVIS_COMMIT} eu.gcr.io/${PROJECT_NAME}/lumen-client:develop

log Creating Production Windshaft image
docker build --quiet --rm=false -t eu.gcr.io/${PROJECT_NAME}/lumen-maps:${TRAVIS_COMMIT} ./windshaft
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-maps:${TRAVIS_COMMIT} eu.gcr.io/${PROJECT_NAME}/lumen-maps:develop

log Creating Production Exporter image
docker build --quiet --rm=false -t eu.gcr.io/${PROJECT_NAME}/lumen-exporter:${TRAVIS_COMMIT} ./exporter
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-exporter:${TRAVIS_COMMIT} eu.gcr.io/${PROJECT_NAME}/lumen-exporter:develop

log Starting Docker Compose environment
docker-compose -p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml up --no-color -d --build

bash ci/helpers/wait-for-docker-compose-to-start.sh

log Running Backend functional tests
docker-compose -p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml run --no-deps backend-functional-tests /app/import-and-run.sh functional-and-seed

log Running the end to end tests against local Docker Compose Environment
#./ci/e2e-test.sh akvolumenci http://t1.lumen.local/?auth=keycloak

log Done
#docker-compose -p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml down
