(ns akvo-dash.core
  (:require [clojure.string :as str]
            [clojurewerkz.elastisch.rest.document :as esd]))


(defn get-operation
  [^String event-type]
  (cond
    (.endsWith event-type "Created") :put
    (.endsWith event-type "Updated") :post
    (.endsWith event-type "Deleted") :delete
    :default :noop))

(defn enhance-event
  [{:keys [offset payload]}]
  {:offset offset
   :operation (get-operation (payload "eventType"))
   :mapping-type (str/lower-case (get-in payload ["entity" "type"]))
   :document (payload "entity")
   :opts {:id (get-in payload ["entity" "id"])
          :timestamp (get-in payload ["context" "timestamp"])}})

(defmulti process-event
  (fn [event index elastic]
    [(:operation event) (:mapping-type event)]))

(defmethod process-event :default [_])

(defmethod process-event [:put "question"]
  [event index elastic]
  (esd/create (:conn elastic) index "question" (:document event) (:opts event)))

(defmethod process-event [:put "answer"]
  [event index elastic]
  (let [conn (:conn elastic)
        q (esd/get conn  index "question" (str (get-in event [:document "questionId"])))
        doc (assoc (:document event) "displayText" (get-in q [:_source :displayText]))]
    (esd/create conn index "answer" doc (:opts event))))

(defmethod process-event [:post "answer"]
  [event elastic]
  (prn event elastic))

(defmethod process-event [:delete "answer"]
  [event index elastic]
  (prn event elastic))



