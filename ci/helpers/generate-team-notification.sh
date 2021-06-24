#!/usr/bin/env bash

OLDER_GIT_VERSION=$1
NEWEST_GIT_VERSION=$2
MSG=$3
COLOR=$4

docker run --rm -e ZULIP_CLI_TOKEN -v ~/.config:/home/akvo/.config -v "$(pwd)":/app \
  -it akvo/akvo-devops:20201023.101935.7dacd92 \
  generate-zulip-notification.sh "${OLDER_GIT_VERSION}" "${NEWEST_GIT_VERSION}" "${MSG}" "${COLOR}" "anything" "akvo-lumen" "Flumen"
