#!/bin/sh

echo Installing and starting test server...

npm install
npm rebuild node-sass
npm run build
npm run start:static
