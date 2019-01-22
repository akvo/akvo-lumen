(ns akvo.lumen.specs.dataset
  (:require [akvo.lumen.lib.dataset.utils :as dataset.utils]
            [clojure.spec.alpha :as s]))

(alias 'db.dsv.s 'akvo.lumen.specs.db.dataset-version)

(s/fdef dataset.utils/find-column
  :args (s/alt :by-name (s/cat :columns ::db.dsv.s/columns
                               :v (s/nilable string?))
               :by-filter (s/cat :columns ::db.dsv.s/columns
                                 :v (s/nilable string?)
                                 :filter-by keyword?)))
