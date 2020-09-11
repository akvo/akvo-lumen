#!/usr/bin/env bash

set -eu

export DB_HOST=""
export DB_NAME=""
export DB_USER=""
export PASSWORD=""

dbs=$(cat creds.txt | cut -f 1 -d,)

for i in $dbs; do
  echo $i
  ./dump-one-db.sh $i $i.gz
done
