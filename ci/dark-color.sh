#!/usr/bin/env bash

LIVE_COLOR=$1
if [ ${LIVE_COLOR} == "blue" ]; then
    DARK_COLOR=green
else
    DARK_COLOR=blue
fi
echo ${DARK_COLOR}