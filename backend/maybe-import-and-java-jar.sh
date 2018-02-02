#!/usr/bin/env bash

if [ -f "/pg-certs/server.crt" ]; then
    keytool -import -trustcacerts -keystore /etc/ssl/certs/java/cacerts -storepass changeit -noprompt -alias postgrescert -file /pg-certs/server.crt
fi

if [ "${WAIT_FOR_DB}" = "true" ]; then
  /app/wait-for-dependencies.sh
fi

java -jar /app/akvo-lumen.jar