#!/usr/bin/env bash

set -eu

token() {
    curl --silent \
	 --location \
	 --request POST \
	 --data "grant_type=password" \
	 --data "client_id=admin-cli" \
	 --data "username=admin" \
	 --data "password=password" \
	 --url "http://auth.lumen.local:8080/auth/realms/master/protocol/openid-connect/token" \
	| jq -M -r '.access_token'
}

group_id() {
    bearer=$(token)
    curl --silent \
	 --location \
	 --header "Authorization: Bearer ${bearer}" \
	 --header "Content-Type: application/json" \
	 --url "http://auth.lumen.local:8080/auth/admin/realms/akvo/groups" \
	| jq -M -r '.[0] | recurse(.subGroups[]) | select(.path == "/akvo/lumen/t1/admin") | .id'
}

user_id() {
    bearer=$(token)
    curl --silent \
	 --location \
	 --header "Authorization: Bearer ${bearer}" \
	 --header "Content-Type: application/json" \
	 --url "http://auth.lumen.local:8080/auth/admin/realms/akvo/users" \
	| jq -M -r ".[] | select( .email == \"${1}\" ) | .id"
}

assign_group() {
    bearer=$(token)
    curl --silent \
	 --location \
	 --request PUT \
	 --header "Authorization: Bearer ${bearer}" \
	 --header "Content-Type: application/json" \
	 --url "http://auth.lumen.local:8080/auth/admin/realms/akvo/users/${1}/groups/${2}"
}

new_user() {
    bearer=$(token)
    curl --silent \
	 --location \
	 --request POST \
	 --header "Authorization: Bearer ${bearer}" \
	 --header "Content-Type: application/json" \
	 --data @/tmp/new-user.json \
	 --url "http://auth.lumen.local:8080/auth/admin/realms/akvo/users"
}

# main

cat <<EOF > /tmp/new-user.json
{
    "access": {
        "manage": true,
        "impersonate": true,
        "mapRoles": true,
        "view": true,
        "manageGroupMembership": true
    },
    "notBefore": 0,
    "requiredActions": [],
    "disableableCredentialTypes": [
        "password"
    ],
    "email": "xxxxx",
    "lastName": "Admin",
    "firstName": "Akvo",
    "emailVerified": true,
    "totp": false,
    "enabled": true,
    "username": "local-admin"
}
EOF

email="${1}"
sed -i".bak" -e "s/xxxxx/${email}/" /tmp/new-user.json
new_user
uid=$(user_id "${email}")
gid=$(group_id)
assign_group "${uid}" "${gid}"
