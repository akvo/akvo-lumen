#!/usr/bin/env bash

set -eu

keytool -import -trustcacerts -keystore "${JAVA_HOME}/jre/lib/security/cacerts" -storepass changeit -noprompt -alias postgrescert -file /pg-certs/server.crt

./run-as-user.sh lein repl :headless
