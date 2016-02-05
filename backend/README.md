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


## Legal

Copyright © 2016 - present Akvo.org
