#!/usr/bin/env bash

if [ -f "/pg-certs/server.crt" ]; then
    keytool -import -trustcacerts -keystore /etc/ssl/certs/java/cacerts -storepass changeit -noprompt -alias postgrescert -file /pg-certs/server.crt
fi

if [ "${WAIT_FOR_DB}" = "true" ]; then
    MAX=30
    TRIES=0
    SQL="SELECT ST_AsText(ST_MakeLine(ST_MakePoint(1,2), ST_MakePoint(3,4)))" # Verify that *PostGIS* is available
    DB_UP=""
    while [[ ${TRIES} -lt ${MAX} ]] && [[ -z "${DB_UP}" ]]; do
        echo "Waiting for DB to start ..."
        sleep 5
        DB_UP=$( (psql --username=lumen --host=postgres --dbname=lumen_tenant_1 -c "${SQL}" 2>&1 | grep "LINESTRING(1 2,3 4)") || echo "")
        let TRIES=${TRIES}+1;
    done

    MAX=30
    TRIES=0
    wget http://auth.lumen.local:8080/auth/realms/akvo/.well-known/openid-configuration -q -O /dev/null
    KEYCLOAK_UP=$?
    while [[ ${TRIES} -lt ${MAX} ]] && [[ ${KEYCLOAK_UP} -ne 0 ]]; do
        echo "Waiting for KeyCloak to start ..."
        sleep 1
        wget http://auth.lumen.local:8080/auth/realms/akvo/.well-known/openid-configuration -q -O /dev/null
        KEYCLOAK_UP=$?
        let TRIES=${TRIES}+1;
    done

fi

java -jar /app/akvo-lumen.jar