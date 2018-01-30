#!/usr/bin/env bash

set -e

log () {
   echo "`date +"%T"` - INFO - $@"
}

npm set progress=false
log Installing npm
npm install
log Rebuild node-sass
npm rebuild node-sass
log Linting
npm run lint
log Testing
npm run test
log Building prod assets
npm run build
