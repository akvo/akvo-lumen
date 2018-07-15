(disable-warning
 {:linter :constant-test
  :if-inside-macroexpansion-of #{'clojure.java.jdbc/with-db-connection}
  :within-depth 4
  :reason "Allow {:read-only? true} as parameter"})

(disable-warning
  {:linter :suspicious-expression
   :for-macro 'clojure.core/and
   :if-inside-macroexpansion-of #{'clojure.spec/every 'clojure.spec.alpha/every
                                  'clojure.spec/and 'clojure.spec.alpha/and
                                  'clojure.spec/keys 'clojure.spec.alpha/keys}
   :within-depth 6
   :reason "clojure.spec's macros `keys`, `every`, and `and` often contain `clojure.core/and` invocations with only one argument."})

