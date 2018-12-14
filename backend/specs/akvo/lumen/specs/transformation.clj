(ns akvo.lumen.specs.transformation
  (:require [akvo.lumen.specs :as lumen.s :refer (sample)]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.util :as u]
            [akvo.lumen.specs.import.column :as import.column.s]
            [akvo.lumen.specs.import.values :as i.values.s]
            [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(create-ns  'akvo.lumen.specs.db.dataset-version)
(alias 'db.dsv 'akvo.lumen.specs.db.dataset-version)

(create-ns  'akvo.lumen.specs.db.dataset-version.column)
(alias 'db.dsv.column 'akvo.lumen.specs.db.dataset-version.column)


(s/def ::db.dsv/id ::lumen.s/str-uuid)
(s/def ::db.dsv/dataset-id ::lumen.s/str-uuid)
(s/def ::db.dsv/job-execution-id (s/nilable ::lumen.s/str-uuid))

(defn- ds-table-name? [s]
  (let [[_ uuid] (string/split  s #"ds_")]
       (lumen.s/str-uuid? (string/replace uuid "_" "-"))))

(s/def ::db.dsv/table-name (s/with-gen
                             (s/and string? ds-table-name?)
                             #(s/gen (into #{} (take 5 (repeatedly (partial u/gen-table-name "ds")))))))

(defn- imported-table-name? [s]
  (let [[_ uuid] (string/split  s #"imported_")]
       (lumen.s/str-uuid? (string/replace uuid "_" "-"))))

(s/def ::db.dsv/imported-table-name (s/with-gen
                                      (s/and string? imported-table-name?)
                                      #(s/gen (into #{} (take 5 (repeatedly (fn [] (str "imported_" (u/squuid)))))))))

(s/def ::db.dsv/version int?)
(s/def ::db.dsv/transformations any?) ;; TODO complete ... 

(s/def ::db.dsv.column/key boolean?)
(s/def ::db.dsv.column/hidden boolean?)
(s/def ::sort #{"asc" "dsc"})

(s/def ::db.dsv.column/sort (s/nilable ::sort))
(s/def ::db.dsv.column/direction (s/nilable string?))
(s/def ::db.dsv.column/columnName string?)

(s/def ::db.dsv.column/id (s/nilable keyword?))
(s/def ::db.dsv/column* (s/keys :req-un [::db.dsv.column/hidden ::db.dsv.column/direction
                                         ::db.dsv.column/sort ::db.dsv.column/columnName]))

(s/def ::db.dsv/column (s/merge ::import.column.s/header ::db.dsv/column*))

(s/def ::db.dsv/columns (s/coll-of ::db.dsv/column :kind vector? :distinct true))



(s/def ::next-dataset-version (s/keys :req-un [::db.dsv/id ::db.dsv/dataset-id
                                               ::db.dsv/job-execution-id ::db.dsv/table-name
                                               ::db.dsv/imported-table-name ::db.dsv/version
                                               ::db.dsv/transformations ::db.dsv/columns]))
