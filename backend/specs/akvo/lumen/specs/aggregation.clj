(ns akvo.lumen.specs.aggregation
  (:require [akvo.lumen.specs :as lumen.s :refer (sample)]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.lib.aggregation.pie :as aggregation.pie]
            [akvo.lumen.lib.aggregation.pivot :as aggregation.pivot]
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
(s/def ::aggregation.pie/bucketColumn ::db.dsv.column/columnName)
(s/def ::aggregation.pie/query (s/keys :req-un [(s/nilable ::postgres.filter/filters)
                                                ::aggregation.pie/bucketColumn]))

(s/fdef aggregation.pie/query
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :dataset ::aggregation/dataset
	 :query ::aggregation.pie/query)
  :ret any?)

(s/def ::aggregation.pivot/categoryColumn ::db.dsv.column/columnName)
(s/def ::aggregation.pivot/rowColumn ::db.dsv.column/columnName)
(s/def ::aggregation.pivot/valueColumn ::db.dsv.column/columnName)
(s/def ::aggregation/aggregation #{"mean"  
                                   "sum"   
                                   "min"   
                                   "max"   
                                   "count"}) 

(s/def ::aggregation.pivot/query (s/keys :req-un [(s/nilable ::postgres.filter/filters)
                                                  ::aggregation/aggregation]
                                         :opt-un [::aggregation.pivot/rowColumn
                                                  ::aggregation.pivot/valueColumn
                                                  ::aggregation.pivot/categoryColumn]))


(s/fdef aggregation.pivot/query
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :dataset ::aggregation/dataset
	 :query ::aggregation.pivot/query)
  :ret any?)


