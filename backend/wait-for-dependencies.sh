#!/usr/bin/env bash

set -eu

MAX_ATTEMPTS=120
KEYCLOAK=""
ATTEMPTS=0

echo "Waiting for Keycloak ..."

while [[ -z "${KEYCLOAK}" && "${ATTEMPTS}" -lt "${MAX_ATTEMPTS}" ]]; do
    sleep 1
    KEYCLOAK=$( (curl -v "http://auth.lumen.local:8080/auth/realms/akvo/.well-known/openid-configuration" 2>&1 | grep "HTTP/1.1 200 OK") || echo "")
    let ATTEMPTS+=1
done

if [[ -z "${KEYCLOAK}" ]]; then
    echo "Keycloak is not available"
    exit 1
fi

echo "Keycloak is ready!"

echo "Waiting for PostgreSQL ..."


# In JRE container JAVA_HOME points to /jre
# In JDK container JAVA_HOME points to the parent of */jre
cacerts_file=""
# JDK-8189131 : Open-source the Oracle JDK Root Certificates
# https://bugs.java.com/bugdatabase/view_bug.do?bug_id=JDK-8189131
if [ "${JAVA_HOME}" == "/docker-java-home" ];
then
    cacerts_file="${JAVA_HOME%jre}/jre/lib/security/cacerts"
elif [ "${JAVA_HOME}" == "/usr/local/openjdk-8" ]; then
    echo "@/usr/local/openjdk-8"
    cacerts_file="${JAVA_HOME}/jre/lib/security/cacerts"
else
    cacerts_file="${JAVA_HOME%jre}/lib/security/cacerts"
fi

echo "---->"
whoami
echo "@JAVA HOME"
echo $JAVA_HOME
echo $cacerts_file
find $JAVA_HOME -name "cacerts"
ls -la "${cacerts_file%cacerts}"
echo "<----"

ATTEMPTS=0
CERT_INSTALLED=$( (keytool -list -trustcacerts -keystore "${cacerts_file}" -storepass changeit | grep postgrescert) || echo "not found")

while [[ "${CERT_INSTALLED}" == "not found" && "${ATTEMPTS}" -lt "${MAX_ATTEMPTS}" ]]; do
    if [[ -f "${PGSSLROOTCERT}" ]]; then
	keytool -import -trustcacerts -keystore "${cacerts_file}" -storepass changeit -noprompt -alias postgrescert -file "${PGSSLROOTCERT}" || true
	CERT_INSTALLED=$( (keytool -list -trustcacerts -keystore "${cacerts_file}" -storepass changeit | grep postgrescert) || echo "not found")
    fi
    sleep 1
    let ATTEMPTS+=1
done

if [[ "${CERT_INSTALLED}" == "not found" ]]; then
    echo "PostgreSQL SSL certificate is not available"
    exit 1
fi

ATTEMPTS=0
PG=""
SQL="SELECT ST_AsText(ST_MakeLine(ST_MakePoint(1,2), ST_MakePoint(3,4)))" # Verify that *PostGIS* is available


while [[ -z "${PG}" && "${ATTEMPTS}" -lt "${MAX_ATTEMPTS}" ]]; do
    sleep 1
    PG=$( (psql --username=lumen --host=postgres --dbname=lumen_tenant_1 --no-password --command "${SQL}" 2>&1 | grep "LINESTRING(1 2,3 4)") || echo "")
    let ATTEMPTS+=1
done

if [[ -z "${PG}" ]]; then
    echo "PostgreSQL is not available"
    exit 1
fi

echo "PostgreSQL is ready!"
