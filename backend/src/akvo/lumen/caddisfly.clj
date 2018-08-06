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


(defn kw-child-id-fun [parent-id]
  (fn [id*]
    (keyword (format "c%s%s" parent-id id*))))

(defn kw-id [id*] (keyword (format "c%s" id*)))

(defn question->columns
  "a question could reflect several columns/values. Example: caddisfly values.
  Column ids are generated based in question ids and childs option"
  [{:keys [name id caddisflyResourceUuid] :as q}]
  (let [column {:title name
                :type  "TODO";;(question-type->lumen-type q)
                :id    id}]
    (if caddisflyResourceUuid
      (->> (child-questions column caddisflyResourceUuid)
           (map #(update % :id (kw-child-id-fun id))))
      [(update column :id kw-id)])))


(defn response->columns
  "returns a vector of tuples of columns reponses [id1 r1 id2 r2 ...]"
  [{:keys [type id caddisflyResourceUuid] :as q} response]
  (if caddisflyResourceUuid
    (child-responses (kw-child-id-fun id) response)
    [(kw-id id) ("TODO" "v3/render-response" type response)]))
