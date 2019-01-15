(ns akvo.lumen.specs.dataset
  (:require [akvo.lumen.specs :as lumen.s :refer (sample)]
            [akvo.lumen.specs.transformation]
            [akvo.lumen.lib.dataset.utils :as dataset.utils]
            [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]))

(alias 'db.dsv 'akvo.lumen.specs.db.dataset-version)

(s/fdef dataset.utils/find-column
  :args (s/alt :by-name (s/cat :columns ::db.dsv/columns
                               :v (s/nilable string?))
               :by-filter (s/cat :columns ::db.dsv/columns
                                 :v (s/nilable string?)
                                 :filter-by keyword?)))
