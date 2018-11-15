#!/bin/bash

KEYCLOAK_USERNAME=${KEYCLOAK_USERNAME:-lumen}
KEYCLOAK_PASSWORD=${KEYCLOAK_PASSWORD:-lumen}
KEYCLOAK_URL=${KEYCLOAK_URL:-http://localhost:8080/auth}
KEYCLOAK_REALM=${KEYCLOAK_REALM:-akvo}
KEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID:-akvo-lumen}

ACCESS_TOKEN=$(curl -s -XPOST \
                    -H "Content-Type: application/x-www-form-urlencoded" \
                    -d "username=$KEYCLOAK_USERNAME&password=$KEYCLOAK_PASSWORD&client_id=$KEYCLOAK_CLIENT_ID&grant_type=password" \
                    $KEYCLOAK_URL/realms/$KEYCLOAK_REALM/protocol/openid-connect/token \
                    | jq '.access_token' | tr -d '"')

echo "Authorization: Bearer $ACCESS_TOKEN"
echo "Content-Type: application/json"

# When token expires run './headers.sh > headers'
# Run curl  -v -H "$(cat headers)" t1.dash.akvo.org:3000/api/flow/library
