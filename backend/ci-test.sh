#!/usr/bin/env bash

lein do clean, check, test :all, eastwood '{:source-paths ["src" "test"]}'