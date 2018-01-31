#!/bin/sh

keytool -import -trustcacerts -keystore /usr/lib/jvm/java-1.8-openjdk/jre/lib/security/cacerts -storepass changeit -noprompt -alias postgrescert -file /pg-certs/server.crt

if [ -z "$1" ]; then
    ./run-as-user.sh lein repl :headless
elif [ "$1" == "functional-and-seed" ]; then
    # Two thing in one so that we avoid starting yet another JVM
    ./run-as-user.sh lein do test :functional, run -m dev/migrate-and-seed
else
    true
fi