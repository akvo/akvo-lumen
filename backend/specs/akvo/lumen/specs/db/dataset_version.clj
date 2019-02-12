(ns akvo.lumen.specs.db.dataset-version
  (:require [clojure.spec.alpha :as s]
            [clojure.string :as string]
            [akvo.lumen.specs.import.column :as import.column.s]
            [akvo.lumen.specs.db.dataset-version.column :as db.dsv.column]
            [akvo.lumen.util :as u]
            [akvo.lumen.specs :as lumen.s]))

(s/def ::id ::lumen.s/str-uuid)
(s/def ::dataset-id (s/with-gen
                             lumen.s/str-uuid?
                             lumen.s/str-uuid-gen))
(s/def ::job-execution-id (s/nilable ::lumen.s/str-uuid))

(defn- ds-table-name? [s]
  (let [[_ uuid] (string/split  s #"ds_")]
       (lumen.s/str-uuid? (string/replace uuid "_" "-"))))

(s/def ::table-name (s/with-gen
                             (s/and string? ds-table-name?)
                             #(s/gen (into #{} (take 5 (repeatedly (partial u/gen-table-name "ds")))))))

(defn- imported-table-name? [s]
  (let [[_ uuid] (string/split  s #"imported_")]
       (lumen.s/str-uuid? (string/replace uuid "_" "-"))))

(s/def ::imported-table-name (s/with-gen
                                      (s/and string? imported-table-name?)
                                      #(s/gen (into #{} (take 5 (repeatedly (fn [] (str "imported_" (u/squuid)))))))))

(s/def ::version int?)

(s/def ::column* (s/keys :req-un [::db.dsv.column/hidden ::db.dsv.column/direction
                                  ::db.dsv.column/sort ::db.dsv.column/columnName]))

(s/def ::column (s/merge ::import.column.s/header ::column*))


(s/def ::columns (s/coll-of ::column :distinct true))
