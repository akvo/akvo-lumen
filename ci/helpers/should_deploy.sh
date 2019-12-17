#!/usr/bin/env bash

set -eu

SHOULD_DEPLOY="true"

if [[ "${CI_BRANCH}" != "master" ]] && [[ ! "${CI_TAG:-}" =~ promote-.* ]]; then
    SHOULD_DEPLOY="false"
fi

if [[ "${CI_PULL_REQUEST}" != "false" ]]; then
    SHOULD_DEPLOY="false"
fi

echo ${SHOULD_DEPLOY}
