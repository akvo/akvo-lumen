FROM jboss/keycloak:3.1.0.Final

COPY akvo.json /tmp/akvo.json
COPY theme/akvo /opt/jboss/keycloak/themes/akvo
COPY standalone.xml /opt/jboss/keycloak/standalone/configuration/standalone.xml

ENV KEYCLOAK_USER=admin
ENV KEYCLOAK_PASSWORD=admin

CMD ["-b", "0.0.0.0", \
     "-Dkeycloak.migration.action=import", \
     "-Dkeycloak.migration.provider=singleFile", \
     "-Dkeycloak.migration.file=/tmp/akvo.json", \
     "-Dkeycloak.migration.strategy=OVERWRITE_EXISTING"]
