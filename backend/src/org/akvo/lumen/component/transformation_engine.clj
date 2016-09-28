(ns org.akvo.lumen.component.transformation-engine
  (:require [com.stuartsierra.component :as component]
            [org.akvo.lumen.transformation.engine :as engine])
  (:import [java.util.concurrent LinkedBlockingQueue]))

(defprotocol TransformationQueue
  (enqueue [this command] "Enqueue a command (transformation or undo) to the transformation engine"))

(defrecord TransformationEngine [queue running? sentinel]
  component/Lifecycle
  (start [this]
    (reset! running? true)
    (let [engine (future
                   (loop [transformation (.take queue)]
                     (when-not (identical? transformation sentinel)
                       (try
                         (let [{:keys [completion-promise tenant-conn job-id dataset-id command]} transformation]
                           (condp = (:type command)
                             :transformation
                             (engine/execute-transformation completion-promise
                                                            tenant-conn
                                                            job-id
                                                            dataset-id
                                                            (:transformation command))

                             :undo
                             (engine/execute-undo completion-promise
                                                  tenant-conn
                                                  job-id
                                                  dataset-id)))
                         (catch Exception e
                           (.printStackTrace e)))
                       (recur (.take queue)))))]
      (assoc this :transformation-engine engine)))

  (stop [this]
    (if-let [engine (:transformation-engine this)]
      (do (reset! running? false)
          (.put queue sentinel)
          @engine
          (assoc this :transformation-engine nil))
      this))

  TransformationQueue
  (enqueue [this transformation]
    (let [completion-promise (promise)]
      (when-not @running?
        (throw (ex-info "Transformation Engine is not running"
                        {:transformation transformation})))
      (.put queue (assoc transformation :completion-promise completion-promise))
      completion-promise)))

(defn transformation-engine [_]
  (map->TransformationEngine {:queue (LinkedBlockingQueue.)
                              :running? (atom false)
                              :sentinel (Object.)}))
