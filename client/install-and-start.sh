#!/usr/bin/env bash

set -eu

echo Installing and starting dev server...

npm install
npm rebuild node-sass
npm start
