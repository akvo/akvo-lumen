#!/usr/bin/env bash

set -o errexit
set -o nounset

DOCKER_COMPOSE_PROJECT="${1:-akvolumen}"
LUMEN_AUTH="${2:-keycloak}"
LUMEN_URL="${3:-http://t1.lumen.local:3030/}"
LUMEN_USER="${4:-jerome@t1.akvolumen.org}"
LUMEN_PASSWORD="${5:-password}"
LUMEN_AUTH_CLIENT_ID="${6:-}"
LUMEN_AUTH_CLIENT_PASSWORD="${7:-}"
CYPRESS_RECORD_KEY="${CYPRESS_RECORD_KEY:-}"

if [[ "${DOCKER_COMPOSE_PROJECT}" == "akvolumen" ]]; then
    docker-compose \
	run --no-deps \
        -e CYPRESS_LUMEN_AUTH="${LUMEN_AUTH}" \
        -e CYPRESS_LUMEN_URL="${LUMEN_URL}" \
	-e CYPRESS_LUMEN_USER="${LUMEN_USER}" \
	-e CYPRESS_LUMEN_PASSWORD="${LUMEN_PASSWORD}" \
	-e CYPRESS_RECORD_KEY="${CYPRESS_RECORD_KEY}" \
	fe-e2e-tests run.sh
else
    docker-compose \
	-p akvo-lumen-ci \
	-f docker-compose.yml \
	-f docker-compose.ci.yml \
	run --no-deps \
        -e CYPRESS_LUMEN_AUTH="${LUMEN_AUTH}" \
	-e CYPRESS_LUMEN_AUTH_CLIENT_ID="${LUMEN_AUTH_CLIENT_ID}" \
	-e CYPRESS_LUMEN_AUTH_CLIENT_PASSWORD="${LUMEN_AUTH_CLIENT_PASSWORD}" \
	-e CYPRESS_LUMEN_URL="${LUMEN_URL}" \
	-e CYPRESS_LUMEN_USER="${LUMEN_USER}" \
	-e CYPRESS_LUMEN_PASSWORD="${LUMEN_PASSWORD}" \
	-e CYPRESS_RECORD_KEY="${CYPRESS_RECORD_KEY}" \
	-e ELECTRON_ENABLE_LOGGING="true" \
	fe-e2e-tests run.sh
fi
