(ns user
  (:require [clojure.java.jdbc :as j]
            [cheshire.core :as json]
            [akvo-dash.system :refer :all]
            [akvo-dash.core :refer :all]
            [com.stuartsierra.component :as component]
            [clojurewerkz.elastisch.rest.index :as idx]
            [clojurewerkz.elastisch.rest.document :as doc])
  (:import org.postgresql.util.PGobject))

(comment

  (def pg-db {:subprotocol "postgresql"
              :subname "//localhost:5432/akvoflow-1"
              :user "postgres"})

  (def sql "SELECT id as offset, payload FROM event_log WHERE payload @> '{\"eventType\": \"answerCreated\", \"entity\": {\"questionId\": 196248}}' ORDER BY id, payload->'entity'->'id'")

  (def events (j/query pg-db sql))

  (defn parse [{:keys [payload offset]}]
    {:offset offset
     :payload (json/parse-string (.getValue ^PGobject payload))})

  (def evts (map #(-> % parse enhance-event) events))

  (def system (new-system {:elastic-host "localhost"
                           :elastic-port 9200 }))

  (process-event (first evts) "akvoflow-1" (:elastic system))

  (alter-var-root #'system component/start)

  (def sql "SELECT id as offset, payload FROM event_log WHERE payload @> '{\"eventType\": \"answerCreated\"}' ORDER BY id, payload->'entity'->'id' LIMIT 5")

  (doseq [e (map #(-> % parse enhance-event) (j/query pg-db sql))]
    (process-event e "akvoflow-1" (:elastic system)))

)
