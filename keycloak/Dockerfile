FROM jboss/keycloak:3.1.0.Final

ADD akvo.json /tmp/akvo.json
ADD themes/akvo /opt/jboss/keycloak/themes/akvo

ENV KEYCLOAK_USER=admin
ENV KEYCLOAK_PASSWORD=admin

CMD ["-b", "0.0.0.0", "-Dkeycloak.migration.action=import", \
     "-Dkeycloak.migration.provider=singleFile", \
     "-Dkeycloak.migration.file=/tmp/akvo.json", \
     "-Dkeycloak.migration.strategy=OVERWRITE_EXISTING"]
