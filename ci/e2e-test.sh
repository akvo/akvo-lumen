#!/usr/bin/env bash

set -o errexit
set -o nounset

CYPRESS_RECORD_KEY="${CYPRESS_RECORD_KEY:-}"
DOCKER_COMPOSE_PROJECT="${1:-akvolumen}"
LUMEN_PASSWORD="${4:-password}"
LUMEN_SENTRY_ENVIRONMENT="Travis E2E tests"
LUMEN_SENTRY_SERVER_NAME="green"
LUMEN_URL="${2:-http://t1.lumen.local:3030/}"
LUMEN_USER="${3:-jerome}"

if [[ "${DOCKER_COMPOSE_PROJECT}" == "akvolumen" ]]; then
    echo "@ akvolumen"
    docker-compose \
        run --no-deps \
        -e CYPRESS_LUMEN_URL="${LUMEN_URL}" \
        -e CYPRESS_LUMEN_USER="${LUMEN_USER}" \
        -e CYPRESS_LUMEN_PASSWORD="${LUMEN_PASSWORD}" \
        -e CYPRESS_RECORD_KEY="${CYPRESS_RECORD_KEY}" \
        fe-e2e-tests run.sh
else
    echo "@ Not akvolumen"
    docker-compose \
        -p akvo-lumen-ci \
        -f docker-compose.yml \
        -f docker-compose.ci.yml \
        run --no-deps \
        -e CYPRESS_LUMEN_URL="${LUMEN_URL}" \
        -e CYPRESS_LUMEN_USER="${LUMEN_USER}" \
        -e CYPRESS_LUMEN_PASSWORD="${LUMEN_PASSWORD}" \
        -e CYPRESS_RECORD_KEY="${CYPRESS_RECORD_KEY}" \
        -e LUMEN_SENTRY_BACKEND_DSN="${LUMEN_SENTRY_BACKEND_DSN}" \
        -e LUMEN_SENTRY_SERVER_NAME="${LUMEN_SENTRY_SERVER_NAME}" \
        -e LUMEN_SENTRY_RELEASE="${TRAVIS_COMMIT}" \
        -e LUMEN_SENTRY_ENVIRONMENT="${LUMEN_SENTRY_ENVIRONMENT}" \
        fe-e2e-tests run.sh
fi
