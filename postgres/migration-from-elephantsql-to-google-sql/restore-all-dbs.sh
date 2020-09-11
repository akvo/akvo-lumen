#!/usr/bin/env bash

set -eu

dbs=$(cat creds.txt)

for i in $dbs; do
  echo $i
  db=$(echo $i | cut -f 1 -d,)
  user=$(echo $i | cut -f 2 -d,)
  password=$(echo $i | cut -f 3- -d,)
  ./create-one-tenant-user.sh "$user" "$password"
  ./create-one-tenant-db.sh "$user" "$db"
  ./restore-one-db.sh $user $password $db $db.gz
done
