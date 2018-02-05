#!/usr/bin/env bash

set -eu

function log {
   echo "`date +"%T"` - INFO - $@"
}

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

COLOR=${1}
DARK_COLOR=$(${DIR}/dark-color.sh ${COLOR})

log Deploying ${COLOR} as LIVE
sed -e "s/\${LIVE_COLOR}/${COLOR}/" -e "s/\${DARK_COLOR}/${DARK_COLOR}/" ci/service.yaml > service.yaml

kubectl apply -f service.yaml
