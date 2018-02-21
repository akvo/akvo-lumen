FROM openjdk:8-jre-stretch
MAINTAINER Akvo Foundation <devops@akvo.org>

RUN set -ex; apt-get update && \
    apt-get install -y --no-install-recommends --no-install-suggests \
    postgis gdal-bin postgresql-client-9.6 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY target/uberjar/akvo-lumen.jar /app/akvo-lumen.jar

COPY maybe-import-and-java-jar.sh /app/maybe-import-and-java-jar.sh
RUN chmod 777 /app/maybe-import-and-java-jar.sh
COPY wait-for-dependencies.sh /app/wait-for-dependencies.sh
RUN chmod 777 /app/wait-for-dependencies.sh

CMD ./maybe-import-and-java-jar.sh