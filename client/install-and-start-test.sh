#!/bin/sh

npm install
npm rebuild node-sass
npm run build
npm run start:test
