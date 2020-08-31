-- :name combine-columns :!
/* :require [clojure.string :as string]
            [hugsql.parameters :refer [identifier-param-quote]] */
UPDATE :i:table-name T1
SET :i:new-column-name = concat (:i:first-column, :separator, :i:second-column)
 FROM :i:table-name
/*~
(string/join ", "
  (for [table  (:tables params)]
    (let [t (identifier-param-quote table options)
          j (identifier-param-quote (:table-name params) options)]
       (str "INNER JOIN " t " ON " j ".rnum = " t ".rnum"))
    ))
~*/

