(ns akvo.lumen.db.transformation.combine
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/combine.sql")

(hugsql/def-sqlvec-fns "akvo/lumen/lib/transformation/combine.sql")

(comment
  "how to debug hugslq queries"
  "https://www.hugsql.org/#using-def-sqlvec-fns"
  (combine-columns-sqlvec {:table-name "ds_54d99727_5e01_43e3_8a9c_eaa790135f05"
                           :tables ["ds_d6909549_dd4f_4679_a507_a3ab0fe7f55b" ]
                           :new-column-name "submitter"
                           :first-column "ds_54d99727_5e01_43e3_8a9c_eaa790135f05.display_name"
                           :second-column "ds_54d99727_5e01_43e3_8a9c_eaa790135f05.instance_id"
                           :separator ","}))
