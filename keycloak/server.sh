#!/bin/bash

set -e

usage() {
  echo "Usage: $0 {build|run|stop}";
  exit 1;
}

[[ $# -eq 1 ]] || usage

docker images > /dev/null || exit 1

case "$1" in
    build)
      docker build -t akvo/keycloak .
      ;;
    run)
      docker run -d -p 8080:8080 --name lumen-keycloak -t akvo/keycloak
      ;;
    stop)
      docker stop lumen-keycloak && docker rm lumen-keycloak
      ;;
    *)
      usage
      ;;
esac
