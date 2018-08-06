-- :name clj-expr-generic-update :! :n
/* :require [clojure.string :as string]
            [hugsql.parameters :refer [identifier-param-quote]] */
update :i:table set
/*~

(println (string/join ","
  (for [[field _] (:updates params)]
    (str (identifier-param-quote (name field) options)
      " = :v:updates." (name field)))))
~*/

/*~

(string/join ","
  (for [[field _] (:updates params)]
    (str (identifier-param-quote (name field) options)
      " = :v:updates." (name field))))
~*/
where rnum = :rnum


-- :name caddisfly-data :?
-- :doc Get all caddisfly column data table
SELECT rnum, :i:column-name FROM :i:table-name
