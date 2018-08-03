(ns akvo.lumen.caddisfly
  (:require [cheshire.core :as json]
            [clojure.tools.logging :as log]
            [clojure.java.io :as io]))

(def parse-json #(json/parse-string (slurp (io/resource %)) keyword))

(def schemas (->> (:tests (parse-json "./caddisfly/tests-schema.json"))
                  (reduce #(assoc % (:uuid %2) %2) {})))

(defn child-questions
  "child ids are defined appending child ids
  so if parent-id is 12345 and child-id is 1 then the resulting new id is 123451"
  [{:keys [title id] :as q} caddisflyResourceUuid]
  (reduce #(conj %
                 (assoc q
                        :title (str title "|" (:name %2) "|" (:unit %2))
                        :id  (keyword (str (name id) (:id %2)))))
          []
          (:results (get schemas caddisflyResourceUuid))))
