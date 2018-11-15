FROM openjdk:8-jre-stretch

RUN set -ex; apt-get update && \
    apt-get -qq install -y --no-install-recommends --no-install-suggests \
    postgis gdal-bin postgresql-client-9.6 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY akvo-lumen.jar /app/akvo-lumen.jar

COPY run-server.sh /app/run-server.sh
COPY wait-for-dependencies.sh /app/wait-for-dependencies.sh
RUN chmod +x /app/*.sh

CMD ["./run-server.sh"]
