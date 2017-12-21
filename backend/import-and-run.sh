#!/usr/bin/env bash

set -eu

CERT_INSTALLED=$((keytool -list -trustcacerts -keystore "${JAVA_HOME}/jre/lib/security/cacerts" -storepass changeit | grep postgrescert) || echo "not found")

if [ "${CERT_INSTALLED}" = "not found" ]; then
    echo "Importing postgres cert"
    keytool -import -trustcacerts -keystore "${JAVA_HOME}/jre/lib/security/cacerts" -storepass changeit -noprompt -alias postgrescert -file /pg-certs/server.crt
fi

MAX_ATTEMPTS=30
KEYCLOAK=""
ATTEMPTS=0

echo "Waiting for Keycloak ..."

while [[ -z "${KEYCLOAK}" && "${ATTEMPTS}" -lt "${MAX_ATTEMPTS}" ]]; do
    sleep 5
    KEYCLOAK=$((curl -v "http://auth.lumen.local:8080/auth/realms/akvo/.well-known/openid-configuration" 2>&1 | grep "HTTP/1.1 200 OK") || echo "")
    let ATTEMPTS+=1
done

if [[ -z "${KEYCLOAK}" ]]; then
    echo "Keycloak is not available"
    exit 1
fi

echo "Keycloak is ready!"

ATTEMPTS=0
PG=""
SQL="SELECT ST_AsText(ST_MakeLine(ST_MakePoint(1,2), ST_MakePoint(3,4)))" # Verify that *PostGIS* is available

echo "Waititng for PostgreSQL ..."
while [[ -z "${PG}" && "${ATTEMPTS}" -lt "${MAX_ATTEMPTS}" ]]; do
    sleep 5
    PG=$((psql --username=lumen --host=postgres --dbname=lumen_tenant_1 -c "${SQL}" 2>&1 | grep "LINESTRING(1 2,3 4)") || echo "")
    let ATTEMPTS+=1
done

if [[ -z "${PG}" ]]; then
    echo "PostgreSQL is not available"
    exit 1
fi

echo "PostgreSQL is ready!"

echo "Starting REPL ..."

./run-as-user.sh lein repl :headless
