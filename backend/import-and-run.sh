#!/usr/bin/env bash

set -e

CERT_INSTALLED=$((keytool -list -trustcacerts -keystore "${JAVA_HOME}/jre/lib/security/cacerts" -storepass changeit | grep postgrescert) || echo "not found")

if [ "${CERT_INSTALLED}" = "not found" ]; then
    echo "Importing postgres cert"
    keytool -import -trustcacerts -keystore "${JAVA_HOME}/jre/lib/security/cacerts" -storepass changeit -noprompt -alias postgrescert -file /pg-certs/server.crt
fi

./wait-for-dependencies.sh

echo "Starting REPL ..."

if [[ -z "$1" ]]; then
    ./run-as-user.sh lein repl :headless
elif [[ "$1" == "functional-and-seed" ]]; then
    # Two thing in one so that we avoid starting yet another JVM
    ./run-as-user.sh lein do test :functional, run -m dev/migrate-and-seed
else
    true
fi