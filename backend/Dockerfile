FROM clojure:lein-2.7.1
MAINTAINER Akvo Foundation <devops@akvo.org>

# COPY . /tmp/lumen
# WORKDIR /app
# RUN cd /tmp/lumen && \
#     lein deps && \
#     lein uberjar && \
#     mv target/uberjar/akvo-lumen.jar /app/akvo-lumen.jar && \
#     rm -rf /tmp/lumen && \
#     rm -rf ~/.m2

WORKDIR /app
COPY ~/akvo-lumen/backend/target/uberjar/akvo-lumen.jar /app/akvo-lumen.jar

CMD ["java", "-jar", "akvo-lumen.jar"]
