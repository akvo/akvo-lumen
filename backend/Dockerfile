FROM openjdk:8-jre-alpine
MAINTAINER Akvo Foundation <devops@akvo.org>

WORKDIR /app
COPY akvo-lumen.jar /app/akvo-lumen.jar

COPY maybe-import-and-java-jar.sh /app/maybe-import-and-java-jar.sh
RUN chmod 777 /app/maybe-import-and-java-jar.sh

CMD ./maybe-import-and-java-jar.sh