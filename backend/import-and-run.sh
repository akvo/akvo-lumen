#!/usr/bin/env bash

set -eu

keytool -import -trustcacerts -keystore "${JAVA_HOME}/jre/lib/security/cacerts" -storepass changeit -noprompt -alias postgrescert -file /pg-certs/server.crt

MAX_ATTEMPTS=30
KEYCLOAK=""
ATTEMPTS=0

while [[ -z "${KEYCLOAK}" && "${ATTEMPTS}" -lt "${MAX_ATTEMPTS}" ]]; do
    printf "Waiting for Keycloak "
    printf "."
    sleep 5
    KEYCLOAK=$((curl -v "http://auth.lumen.local:8080/auth/realms/akvo/.well-known/openid-configuration" 2>&1 | grep "HTTP/1.1 200 OK") || echo "")
    let ATTEMPTS=${ATTEMPTS}+1
done

echo ""

./run-as-user.sh lein repl :headless
