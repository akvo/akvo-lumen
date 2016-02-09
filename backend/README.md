# Akvo Dash

[Documentation](doc/index.html)

## Quickstart
Dash depends on a Postgres db. If on OS X, Postgres.app is an easy path.

Create local config files:
```sh
$ lein setup
```

Edit profiles.clj to match:
```clojure
{:profiles/dev
 {:env
  {:database-url "jdbc:postgresql://localhost/dash?user=dash&password=password"}}
 :profiles/test {}}
```

To create the Postgres role & database run the provision script:
``` sh
$ ./provision/set-up.sh
```

### Troubleshooting

The `set-up.sh` script assumes that your user has rights to connect and
create databases, roles, etc. You may need define the `PGUSER`
enviroment variable with the proper settings, e.g.

````sh
$ export PGUSER=postgres
$ ./provision/set-up.sh
````

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


## Legal

Copyright © 2016 - present Akvo Foundation
