# Akvo Dash

## Quickstart
Dash depends on a Postgres db. If on OS X, [Postgres.app](http://postgresapp.com/)
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
$ ./provision/set-up.sh
```

### Troubleshooting

The `set-up.sh` script assumes that your user has rights to connect and
create databases, roles, etc. You may need define the `PGUSER`
enviroment variable with the proper settings, e.g.

```sh
$ export PGUSER=postgres
$ ./provision/set-up.sh
```

More info at: [Environment
variables](http://www.postgresql.org/docs/current/static/libpq-envars.html)

### Clean up

There is also a tear-down.sh script to clean up.

At this point all ground work is done and we can fire up a REPL:
```sh
$ lein repl
```

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

Tests can be augmented with ^:integration or ^:wip. Where the first is
starting the full system for integration test. We dont' want to do this for
default unit tests. The "wip" (work in progress) tag let's us build test and
have them in a broken state and not have to comment them out before every
commit / push. This to keep CI happy.

```
lein test       (default, don't run integration or wip tests)
lein test :all  (integration but not wip)
lein test :wip  (test that is worked in progress)
```

## Legal

Copyright © 2016 - present Akvo Foundation
