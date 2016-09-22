(ns org.akvo.lumen.component.transformation-engine
  (:require [com.stuartsierra.component :as component]
            [org.akvo.lumen.transformation.engine :as engine])
  (:import [java.util.concurrent LinkedBlockingQueue]))

(defprotocol TransformationQueue
  (enqueue [this transformation] "Enqueue a transformation to the transformation engine"))

(defrecord TransformationEngine [queue running? sentinel]
  component/Lifecycle
  (start [this]
    (reset! running? true)
    (let [engine (future
                   (loop [transformation (.take queue)]
                     (when-not (identical? transformation sentinel)
                       (engine/execute (:completion-promise transformation)
                                       (:tenant-conn transformation)
                                       (:job-id transformation)
                                       (:dataset-id transformation)
                                       (:transformation-log transformation))
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
      (when-not @running? (throw (ex-info "Transformation Engine is not running"
                                          {:transformation transformation})))
      (.put queue (assoc transformation :completion-promise completion-promise))
      completion-promise)))

(defn transformation-engine [_]
  (map->TransformationEngine {:queue (LinkedBlockingQueue.)
                              :running? (atom false)
                              :sentinel (Object.)}))
