FROM jboss/keycloak:2.5.0.Final

ADD akvo.json /tmp/akvo.json

ENV KEYCLOAK_USER=admin
ENV KEYCLOAK_PASSWORD=admin

CMD ["-b", "0.0.0.0", "-Dkeycloak.migration.action=import", \
     "-Dkeycloak.migration.provider=singleFile", \
     "-Dkeycloak.migration.file=/tmp/akvo.json", \
     "-Dkeycloak.migration.strategy=OVERWRITE_EXISTING"]
