#!/usr/bin/env bash

set -eu

function log {
   echo "$(date +"%T") - INFO - $*"
}

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

COLOR=${1}
DARK_COLOR=$("${DIR}"/helpers/dark-color.sh "${COLOR}")

log Setting "${COLOR}" as LIVE
FLIP_DATE=${2:-$(echo -n "$(TZ=UTC date +"%Y%m%d-%H%M%S")")}
sed -e "s/\${LIVE_COLOR}/${COLOR}/" -e "s/\${DARK_COLOR}/${DARK_COLOR}/" \
  -e "s/\${UTCDATE}/${FLIP_DATE}/" \
  "${DIR}"/k8s/service.yaml > "${DIR}"/flipped.service.yaml

kubectl apply -f "${DIR}"/flipped.service.yaml
