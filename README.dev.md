# Development setup

Akvo Lumen provides a Docker Compose file to start the whole system in development mode.

This Docker Compose environment will have:

- Two tenants
- A KeyCloak server with some accounts setup
- A PostgreSQL DB
- A Backend server with a REPL
- A Client with hot reloading
- A Windshaft server
- A Redis DB

## Hosts
Akvo Lumen is a multi tenant system and to do enable local routing to the tenants 
the following hosts must be defined in your /etc/hosts file:

``` sh
127.0.0.1 t1.lumen.localhost
127.0.0.1 t2.lumen.localhost
127.0.0.1 auth.lumen.localhost
```
Or just

``` sh
sudo sh -c 'echo "127.0.0.1 t1.lumen.localhost t2.lumen.localhost auth.lumen.localhost" >> /etc/hosts'
```

## Start development environment

Before starting the following ports that must be free: 8080, 3000, 3030, 47480, 5432

To start:

``sh
docker-compose -f docker-compose.yml up -d ; docker-compose logs -f --tail=10
``

## Keycloak

Keycloack is available at http://auth.lumen.localhost:8080/

The admin password for keycloak is "admin" / "password". There is an "akvo" realm, where two tenants (t1 & t2) and they are represesnted by the following groups:

```
akvo
└── lumen
    ├── t1
    │   └── admin
    └── t2
        └── admin
```

Available users are:

- "lumen" service account
- "jerome" t1 admin
- "salim" t1 user
- "ruth" t2 admin
- "harry" t2 user
- "kaj" keycloak user not on a tenant

All passwords are "password".

## Client

The Akvo Lumen UI should be accessible at:

 - http://t1.lumen.localhost:3030/
 - http://t2.lumen.localhost:3030/

The Docker Compose file mounts the "client" directory, so any changes in the source directory should 
be picked up automatically by the Webpack server.


#### Tests

Run:

```sh
docker exec -i -t akvolumen_client_1  npm test
```

## Backend

The tenants api root should be accessible at
 - http://t1.lumen.localhost:3000/api
 - http://t2.lumen.localhost:3000/api

Hitting that endpoint should print the tenants dns label and connection pool.

A Clojure REPL should be available on port 47480.

#### Tests

To run the tests, either do it from the REPL or run:

```sh
docker exec -i -t akvolumen_backend_1 lein test
```

#### Postgres

To connect to the postgres server connect using something like:
```sh
psql --host=akvolumen_postgres_1 --port=5432 --dbname=lumen_tenant_1 --username=lumen --password
```

## Windshaft

This container has a development version of the Windshaft container, with plenty of hardcoded assumptions.

The Windshaft server is not exposed directly to the external world, but it is proxied by the Webpack server 
on the url http://t1.lumen.localhost:3030/maps/**. That url forwards the requests to "windshaft:4000".

## Legal
Copyright © 2016 - present Akvo Foundation


### Thanks
<img src="http://www.browserstack.com/images/layout/browserstack-logo-600x315.png" width="280"/>

[BrowserStack](http://www.browserstack.com) is supporting Akvo, allowing us to use their service and infrastructure to test the code in this repository. Thank you for supporting the open source community!
