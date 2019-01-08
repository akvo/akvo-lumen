(ns akvo.lumen.specs.aggregation
  (:require [akvo.lumen.specs :as lumen.s :refer (sample)]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.lib.aggregation.pie :as aggregation.pie]
            [akvo.lumen.postgres.filter :as postgres.filter]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.util :as u]
            [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(create-ns  'akvo.lumen.specs.aggregation.query)
(alias 'aggregation.query.s 'akvo.lumen.specs.aggregation.query)

(alias 'db.dsv.column 'akvo.lumen.specs.db.dataset-version.column)
(alias 'db.dsv 'akvo.lumen.specs.db.dataset-version)

(s/def ::aggregation/dataset (s/keys :req-un [::db.dsv/columns ::db.dsv/table-name]))
(s/def ::aggregation/bucketColumn ::db.dsv.column/columnName)
(s/def ::aggregation.pie/query (s/keys :req-un [(s/nilable ::postgres.filter/filters)
                                                ::aggregation/bucketColumn]))

(s/fdef aggregation.pie/query
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :dataset ::aggregation/dataset
	 :query ::aggregation.pie/query)
  :ret any?)


