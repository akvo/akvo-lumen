(ns akvo.lumen.specs.dashboard.filter
  (:require [clojure.tools.logging :as log]
            [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.specs.dataset :as dataset.s]
            [akvo.lumen.specs.db.dataset-version.column :as db.dsv.column.s]
            [clojure.spec.alpha :as s]))

(s/def ::columns (s/coll-of ::db.dsv.column.s/columnName :distinct true))

(s/def ::datasetId (s/nilable ::dataset.s/id))

(s/def ::filter (s/keys :req-un [::columns ::datasetId]))
