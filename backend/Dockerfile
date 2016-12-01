FROM clojure
MAINTAINER Akvo Foundation <devops@akvo.org>

COPY . /tmp/lumen
WORKDIR /app
RUN cd /tmp/lumen && \
    lein deps && \
    lein uberjar && \
    mv target/uberjar/akvo-lumen.jar /app/akvo-lumen.jar && \
    rm -rf /tmp/lumen && \
    rm -rf ~/.m2

CMD ["java", "-jar", "akvo-lumen.jar"]
