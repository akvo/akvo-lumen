#!/bin/bash

keytool -import -trustcacerts -keystore /usr/lib/jvm/java-8-openjdk-amd64/jre/lib/security/cacerts -storepass changeit -noprompt -alias postgrescert -file /pg-certs/server.crt

lein repl :headless
