(ns akvo.lumen.caddisfly
  (:require [cheshire.core :as json]
            [clojure.tools.logging :as log]
            [clojure.walk :refer (keywordize-keys)]
            [clojure.java.io :as io]))

(def parse-json #(json/parse-string (slurp (io/resource %)) keyword))

(def schemas (->> (:tests (parse-json "./caddisfly/tests-schema.json"))
                  (reduce #(assoc % (:uuid %2) %2) {})))

(defn child-questions
  [{:keys [title id] :as q} caddisflyResourceUuid]
  (reduce #(conj %
                 (assoc q
                        :title (str title "|" (:name %2) "|" (:unit %2))
                        :id (:id %2))) []
          (:results (get schemas caddisflyResourceUuid))))

(defn child-responses
  [id-gen response]
  (reduce
     (fn [v r]
       (conj v (id-gen (:id r)) (:value r)))
     [] (:result (keywordize-keys response)))) ;; we are getting :result of caddisfly json data .. inside are the related tests values .... so far we are treating these like strings
