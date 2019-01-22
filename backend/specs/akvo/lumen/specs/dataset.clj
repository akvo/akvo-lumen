(ns akvo.lumen.specs.dataset
  (:require [akvo.lumen.lib.dataset.utils :as dataset.utils]
            [akvo.lumen.specs.db.dataset-version :as db.dsv.s]
            [clojure.spec.alpha :as s]))

(s/fdef dataset.utils/find-column
  :args (s/alt :by-name (s/cat :columns ::db.dsv.s/columns
                               :v (s/nilable string?))
               :by-filter (s/cat :columns ::db.dsv.s/columns
                                 :v (s/nilable string?)
                                 :filter-by keyword?)))
