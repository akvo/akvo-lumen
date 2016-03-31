# Akvo Dash

## Quickstart
Dash depends on Postgres 9.4. If on OS X, [Postgres.app](http://postgresapp.com/)
is an easy path.

Create local config files:
```sh
$ lein setup
```

Edit profiles.clj to match:
```clojure
{:profiles/dev
 {:env
  {:database-url
    "jdbc:postgresql://localhost/dash?user=dash&password=password"}}
 :profiles/test
 {:env
  {:database-url
    "jdbc:postgresql://localhost/dash_test?user=dash&password=password"}}}
```

To create the Postgres role & database run the provision script:
``` sh
$ ./provision/setup.sh
```

### Troubleshooting

The `setup.sh` script assumes that your user has rights to connect and
create databases, roles, etc. You may need define the `PGUSER`
enviroment variable with the proper settings, e.g.

```sh
$ export PGUSER=postgres
$ ./provision/set-up.sh
```

More info at: [Environment
variables](http://www.postgresql.org/docs/current/static/libpq-envars.html)

### Clean up

``` sh
$ ./provision/tear-down.sh
```


### Start the backend
At this point all ground work is done and we can fire up a REPL:
```sh
$ lein repl
```

Once the repl is up and running, run these commands one by one
```clojure
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

## Legal

Copyright © 2016 - present Akvo Foundation
