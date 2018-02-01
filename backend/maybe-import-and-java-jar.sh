#!/usr/bin/env sh

if [ -f "/pg-certs/server.crt" ]; then
    keytool -import -trustcacerts -keystore /usr/lib/jvm/default-jvm/jre/lib/security/cacerts -storepass changeit -noprompt -alias postgrescert -file /pg-certs/server.crt
fi

if [ "${WAIT_FOR_DB}" = "true" ]; then
    MAX_ATTEMPTS=60
    ATTEMPTS=0
    PG=""
    SQL="SELECT ST_AsText(ST_MakeLine(ST_MakePoint(1,2), ST_MakePoint(3,4)))" # Verify that *PostGIS* is available
    while [[ -z "${PG}" && "${ATTEMPTS}" -lt "${MAX_ATTEMPTS}" ]]; do
        sleep 5
        PG=$((psql --username=lumen --host=postgres --dbname=lumen_tenant_1 -c "${SQL}" 2>&1 | grep "LINESTRING(1 2,3 4)") || echo "")
        let ATTEMPTS+=1
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