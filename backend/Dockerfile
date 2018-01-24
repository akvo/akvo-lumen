FROM openjdk:8-jre-stretch
MAINTAINER Akvo Foundation <devops@akvo.org>

RUN set -ex; apt-get update && \
    apt-get install -y --no-install-recommends --no-install-suggests \
    postgis gdal-bin && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY akvo-lumen.jar /app/akvo-lumen.jar

CMD ["java", "-jar", "akvo-lumen.jar"]
