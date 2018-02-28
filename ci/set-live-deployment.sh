#!/usr/bin/env bash

set -eu

function log {
   echo "$(date +"%T") - INFO - $*"
}

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

COLOR=${1}
DARK_COLOR=$("${DIR}"/helpers/dark-color.sh "${COLOR}")

log Setting "${COLOR}" as LIVE
FLIP_DATE=$(echo -n $(date -u +'%Y-%m-%dT%H:%M:%SZ'))
ACCOUNT=$(echo -n $(gcloud config get-value core/account))
sed -e "s/\${LIVE_COLOR}/${COLOR}/" -e "s/\${DARK_COLOR}/${DARK_COLOR}/" \
  -e "s/\${UTCDATE}/${FLIP_DATE}/" \
  -e "s/\${ACCOUNT}/${ACCOUNT}/" \
  "${DIR}"/k8s/service.yaml > "${DIR}"/service.yaml

kubectl apply -f service.yaml
