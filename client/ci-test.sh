#!/usr/bin/env bash

npm config set spin false
npm install -g npm-cache
npm-cache install
npm run lint && npm test