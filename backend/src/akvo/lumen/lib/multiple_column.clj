(ns akvo.lumen.lib.multiple-column
  (:require [clojure.tools.logging :as log]
            [clojure.java.io :as io]
            [cheshire.core :as json]
            [ring.util.response :refer [response not-found]]))


(def parse-json #(json/parse-string (slurp (io/resource %)) keyword))

(def schemas (->> (:tests (parse-json "./caddisfly/tests-schema.json"))
                  (reduce #(assoc % (:uuid %2) %2) {})))

(def has-image-schema (get schemas "53a1649a-be67-4a13-8cba-1b7db640037c"))

(defn extract-caddisfly
  [subtype-id ]
  (when subtype-id
    (let [schema (get schemas subtype-id)
          res (select-keys schema [:name :hasImage])]
      (assoc res :columns (map (fn [r]
                                 {:id (:id r)
                                  :name (:name r)
                                  :type "string" ;; TODO improve it
                                  }
                                 ) (:results schema))))))

(extract-caddisfly "f88237b7-be3d-4fac-bbee-ab328eefcd14")
(defn all [subtype subtype-id]
  (log/error ::all :subtype subtype :subtype-id subtype-id)
  (if (= subtype "caddisfly")
    (response {:subtype subtype :subtype-id subtype-id
               :multiple-column  (extract-caddisfly subtype-id) })
    (not-found {:subtype subtype})))
