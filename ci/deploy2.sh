#!/usr/bin/env bash

set -eu

function log {
    echo "$(date +"%T") - INFO - $*"
}

export PROJECT_NAME=akvo-lumen
