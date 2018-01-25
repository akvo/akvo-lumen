#!/usr/bin/env sh

if [ -f "/pg-certs/server.crt" ]; then
    keytool -import -trustcacerts -keystore /usr/lib/jvm/default-jvm/jre/lib/security/cacerts -storepass changeit -noprompt -alias postgrescert -file /pg-certs/server.crt
fi

if [ ${WAIT_FOR_DB} = "true" ]; then
    MAX=30
    TRIES=0
    nc -z postgres 5432
    DB_UP=$?
    while [[ ${TRIES} -lt ${MAX} ]] && [[ ${DB_UP} -ne 0 ]]; do
        echo "Waiting for DB to start ..."
        sleep 3
        nc -z postgres 5432
        DB_UP=$?
        let TRIES=${TRIES}+1;
    done
fi

java -jar /app/akvo-lumen.jar