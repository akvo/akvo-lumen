#!/usr/bin/env bash
# shellcheck disable=SC1010

set -eu

function log {
   echo "$(date +"%T") - INFO - $*"
}

export PROJECT_NAME=akvo-lumen

if [ -z "$CI_COMMIT" ]; then
    export CI_COMMIT=local
fi

if [[ "${CI_TAG:-}" =~ promote-.* ]]; then
    log "Skipping build as it is a prod promotion"
    exit 0
fi

backend_image_version=$(awk -F':' '/backend-dev/ {print $3}' docker-compose.override.yml)
docker run -v "$HOME/.m2:/home/akvo/.m2" -v "$(pwd)/backend:/app" "akvo/akvo-lumen-backend-dev:${backend_image_version}" run-as-user.sh clojure -A:dev:test
