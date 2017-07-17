# Akvo Lumen

## Quickstart
Akvo Lumen depends on Postgres 9.4. If on OS X, [Postgres.app](http://postgresapp.com/)
is an easy path.

Create local config files:
```sh
$ lein setup
```

Edit profiles.clj to match (there is a profiles.clj.template file):
```clojure
{:profiles/dev
 {:env
  {:database-url
    "jdbc:postgresql://localhost/lumen?user=lumen&password=password"}}
 :profiles/test
 {:env
  {:database-url
    "jdbc:postgresql://localhost/test_lumen?user=lumen&password=password"}}}
```

To create the Postgres role & databases run the provision script:
``` sh
$ ./provision/setup.sh
```
This creates the central db lumen and two tenants.

### Troubleshooting

The `setup.sh` script assumes that your user has rights to connect and
create databases, roles, etc. You may need define the `PGUSER`
enviroment variable with the proper settings, e.g.

```sh
$ export PGUSER=postgres
$ ./provision/setup.sh
```

More info at: [Environment
variables](http://www.postgresql.org/docs/current/static/libpq-envars.html)

### Clean up

``` sh
$ ./provision/tear-down.sh
```

### Hosts
Akvo Lumen is a multi tenant system and to do enable local routing to the tenatns we
created earlier we need to run the provision/setup-localhost.sh script to add:

``` sh
127.0.0.1 t1.lumen.localhost
127.0.0.1 t2.lumen.localhost
127.0.0.1 auth.lumen.localhost
```

The tenants api root should be accessable at
 - http://t1.lumen.localhost:3000/api
 - http://t2.lumen.localhost:3000/api

Hitting that endpoint should print the tenants dns label and connection pool.

### Start the backend
At this point all ground work is done and we can fire up a REPL:
```sh
$ lein repl
```

Once the repl is up and running, run these commands one by one
```clojure
user=> (dev)     ;; Loads dev namespace
user=> (go)      ;; Init and start the app
user=> (migrate) ;; Migrate the db, requires a running app
user=> (stop)
user=> (start)
user=> (reset)
```

## Docs
``` sh
$ lein codox
$ open doc/index.html
```

## Tests

Tests can be augmented with ^:functional and those will not be runned by default but only if the :all directive is issued.

```
lein test
lein test :all
```
## Generators

This project has several generator functions to help you create files.

To create a new endpoint:

```clojure
dev=> (gen/endpoint "bar")
Creating file src/foo/endpoint/bar.clj
Creating file test/foo/endpoint/bar_test.clj
Creating directory resources/foo/endpoint/bar
nil
```

To create a new component:

```clojure
dev=> (gen/component "baz")
Creating file src/foo/component/baz.clj
Creating file test/foo/component/baz_test.clj
nil
```

To create a new boundary:

```clojure
dev=> (gen/boundary "quz" foo.component.baz.Baz)
Creating file src/foo/boundary/quz.clj
Creating file test/foo/boundary/quz_test.clj
nil
```

## Legal

Copyright © 2016 - present Akvo Foundation
