#!/bin/sh

set -e

log () {
   echo "`date +"%T"` - INFO - $@"
}

npm set progress=false

log Installing npm
npm install

log Rebuild node-sass
npm rebuild node-sass

log Building prod assets
npm run build

log Starting static test server
npm run start:static:forever
