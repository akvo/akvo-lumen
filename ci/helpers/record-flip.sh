#!/usr/bin/env bash

set -eu

function log {
   echo "$(date +"%T") - INFO - $*"
}

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

COLOR=${1}
NEW_LUMEN_VERSION=${2}
OLD_LUMEN_VERSION=${3}
FLIP_DATE=${4}
ACCOUNT=$(echo -n "$(gcloud config get-value core/account)")

sed -e "s/\${COLOR}/${COLOR}/" \
  -e "s/\${UTCDATE}/${FLIP_DATE}/" \
  -e "s/\${ACCOUNT}/${ACCOUNT}/" \
  -e "s/\${NEW_LUMEN_VERSION}/${NEW_LUMEN_VERSION}/" \
  -e "s/\${OLD_LUMEN_VERSION}/${OLD_LUMEN_VERSION}/" \
  "${DIR}"/../k8s/flip-record.yaml > "${DIR}"/flip.record.yaml

kubectl apply -f "${DIR}"/flip.record.yaml