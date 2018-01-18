FROM jboss/keycloak:3.1.0.Final

ENV JB_HOME /opt/jboss
ENV KC_HOME ${JB_HOME}/keycloak
ENV CFG_FILE ${KC_HOME}/standalone/configuration/standalone.xml

COPY akvo.json /tmp/akvo.json
COPY theme/akvo ${KC_HOME}/themes/akvo
COPY keycloak_configuration.txt ${KC_HOME}

ENV KEYCLOAK_USER=admin
ENV KEYCLOAK_PASSWORD=admin

RUN ${KC_HOME}/bin/jboss-cli.sh --file=${KC_HOME}/keycloak_configuration.txt && \
    rm -rf ${KC_HOME}/standalone/configuration/standalone_xml_history/current/*

CMD ["-b", "0.0.0.0", \
     "-Dkeycloak.migration.action=import", \
     "-Dkeycloak.migration.provider=singleFile", \
     "-Dkeycloak.migration.file=/tmp/akvo.json", \
     "-Dkeycloak.migration.strategy=OVERWRITE_EXISTING"]
