(ns akvo.lumen.caddisfly
  (:require [cheshire.core :as json]
            [clojure.tools.logging :as log]
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
