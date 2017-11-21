#!/usr/bin/env bash

docker run --interactive --tty --shm-size 1G --rm --network=akvolumen_default \
       --volume "$PWD/client/e2e-test/script-test.js":/app/index.js --link akvolumen_client_1:t1.lumen.local \
       --link akvolumen_keycloak_1:auth.lumen.local --sysctl net.ipv6.conf.all.disable_ipv6=1 alekzonder/puppeteer:0.13.0
