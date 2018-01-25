#!/bin/sh

keytool -import -trustcacerts -keystore /usr/lib/jvm/java-1.8-openjdk/jre/lib/security/cacerts -storepass changeit -noprompt -alias postgrescert -file /pg-certs/server.crt

if [ -z "$1" ]; then
    ./run-as-user.sh lein repl :headless
elif [ "$1" == "functional" ]; then
    ./run-as-user.sh lein test :functional
elif [ "$1" == "kubernetes-test" ]; then
    ./run-as-user.sh lein test :kubernetes-test
else
    true
fi