(disable-warning
 {:linter :constant-test
  :if-inside-macroexpansion-of #{'clojure.java.jdbc/with-db-connection}
  :within-depth 4
  :reason "Allow {:read-only? true} as parameter"})

(disable-warning
  {:linter :deprecations
   :symbol-matches #{#"^#'akvo\.lumen\.lib\.aggregation\.*}})
