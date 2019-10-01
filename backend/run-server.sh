#!/usr/bin/env bash

set -o errexit
set -o nounset

if [[ "${WAIT_FOR_DEPS:=false}" = "true" ]]; then
  /app/wait-for-dependencies.sh
fi

java -XshowSettings:vm -XX:+PrintGCDetails -XX:+PrintGCDateStamps -jar /app/akvo-lumen.jar
