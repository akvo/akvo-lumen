#!/usr/bin/env bash

set -o errexit
set -o nounset

DOCKER_COMPOSE_PROJECT="${1:-akvolumen}"
LUMEN_URL="${2:-http://t1.lumen.local:3030/}"
LUMEN_USER="${3:-jerome}"
LUMEN_PASSWORD="${4:-password}"
CYPRESS_RECORD_KEY="${CYPRESS_RECORD_KEY:-}"

if [[ "${DOCKER_COMPOSE_PROJECT}" == "akvolumen" ]]; then
    DOCKER_COMPOSE_ARGS=""
else
    DOCKER_COMPOSE_ARGS="-p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml"
fi

docker-compose "${DOCKER_COMPOSE_ARGS}" run --no-deps \
    -e CYPRESS_LUMEN_URL="${LUMEN_URL}" \
    -e CYPRESS_LUMEN_USER="${LUMEN_USER}" \
    -e CYPRESS_LUMEN_PASSWORD="${LUMEN_PASSWORD}" \
    -e CYPRESS_RECORD_KEY="${CYPRESS_RECORD_KEY}" \
    fe-e2e-tests run.sh
