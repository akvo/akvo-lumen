#!/usr/bin/env bash

set -eu

function log {
   echo "`date +"%T"` - INFO - $@"
}

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

CURRENT_LIVE_COLOR=$(${DIR}/live-color.sh)
log "Current LIVE is $CURRENT_LIVE_COLOR"

NEW_LIVE_COLOR=$(${DIR}/dark-color.sh ${CURRENT_LIVE_COLOR})

${DIR}/set-live-deployment.sh ${NEW_LIVE_COLOR}