#!/usr/bin/env bash

set -e

cd backend
lein uberjar
cd ..

docker build -t eu.gcr.io/${PROJECT_NAME}/lumen-backend:$CIRCLE_SHA1 ./backend
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-backend:$CIRCLE_SHA1 eu.gcr.io/${PROJECT_NAME}/lumen-backend:develop
docker build -t eu.gcr.io/${PROJECT_NAME}/lumen-client:$CIRCLE_SHA1 ./client
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-client:$CIRCLE_SHA1 eu.gcr.io/${PROJECT_NAME}/lumen-client:develop
