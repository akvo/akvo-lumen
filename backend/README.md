# Akvo Lumen


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
