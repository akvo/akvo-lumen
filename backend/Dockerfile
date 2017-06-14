FROM clojure:lein-2.7.1
MAINTAINER Akvo Foundation <devops@akvo.org>

WORKDIR /app
COPY ./target/uberjar/akvo-lumen.jar /app/akvo-lumen.jar

# COPY . /tmp/lumen
# WORKDIR /app
# RUN cd /tmp/lumen && \
#     lein deps && \
#     lein uberjar && \
#     mv target/uberjar/akvo-lumen.jar /app/akvo-lumen.jar && \
#     rm -rf /tmp/lumen && \
#     rm -rf ~/.m2

CMD ["java", "-jar", "akvo-lumen.jar"]
