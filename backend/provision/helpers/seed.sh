#!/usr/bin/env bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Setup tenant db 1
psql -c "
CREATE DATABASE dash_tenant_1
WITH OWNER = dash
     TEMPLATE = template0
     ENCODING = 'UTF8'
     LC_COLLATE = 'en_US.UTF-8'
     LC_CTYPE = 'en_US.UTF-8';
"

psql -d dash_tenant_1 -f $DIR/tardis.sql

# Setup tenant db 2
psql -c "
CREATE DATABASE dash_tenant_2
WITH OWNER = dash
     TEMPLATE = template0
     ENCODING = 'UTF8'
     LC_COLLATE = 'en_US.UTF-8'
     LC_CTYPE = 'en_US.UTF-8';
"

psql -d dash_tenant_2 -f $DIR/tardis.sql

# Seed dash db with created tenants
psql -d dash -c "
INSERT INTO tenants (db_uri, label, title)
VALUES ('jdbc:postgresql://localhost/dash_tenant_1?user=dash&password=password',
       't1', 'Tenant 1');

INSERT INTO tenants (db_uri, label, title)
VALUES ('jdbc:postgresql://localhost/dash_tenant_2?user=dash&password=password',
       't2', 'Tenant 2');
"
