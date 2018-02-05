#!/usr/bin/env bash

LIVE_COLOR=$1
if [ "${LIVE_COLOR}" = "blue" ]; then
    DARK_COLOR=green
elif [ "${LIVE_COLOR}" = "green" ]; then
    DARK_COLOR=blue
else
  echo "Color must be blue or green"
  exit 1
fi
echo ${DARK_COLOR}