#!/usr/bin/env bash

set -o errexit
set -o nounset

if [[ "${WAIT_FOR_DEPS:=false}" = "true" ]]; then
  /app/wait-for-dependencies.sh
fi

hostname=$(hostname)
ts=$(date +%s)
dump_filename="${hostname}-${ts}.hprof"

java -XshowSettings:vm \
     -Xlog:gc=info \
     -XX:+UseG1GC \
     -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath="/dumps/${dump_filename}" \
     -jar /app/akvo-lumen.jar
