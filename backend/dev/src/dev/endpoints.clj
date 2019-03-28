(ns dev.endpoints
  (:require [clojure.tools.logging :as log]
            [clojure.java.io :as io]
            [clojure.spec.alpha :as s]
            [dev.endpoints.transit :as dev.transit]
            [akvo.lumen.specs :as lumen.s]
            [ring.util.response :refer [response]]
            [integrant.core :as ig]))

(defn describe-spec-response [spec]
  {:namespace (namespace spec)
   :id (name spec)
   :ns (keyword spec)
   :spec (s/describe spec)})

(defn routes [opts]
  (let [params {:parameters {:path-params {:spec-ns string?
                                           :spec-id string?}}}
        read-spec (fn [{:keys [spec-ns spec-id]}]
                    (keyword (str (apply str (next (seq spec-ns))) "/" spec-id)))]    
    [["/sample"
      ["/:spec-ns/:spec-id"
       ["" {:get (merge params
                        {:handler (fn [{params :path-params}]
                                    (response (lumen.s/sample (read-spec params))))})}]]]
     ["/describe"
      ["/:spec-ns/:spec-id"
       ["" {:get (merge params
                        {:handler (fn [{params :path-params}]
                                    (response (describe-spec-response (read-spec params))))})}]]]
     ["/conform"
      ["/:spec-ns/:spec-id"
       ["" {:post (merge (assoc params :body map?)
                         {:handler (fn [{params :path-params
                                         body :body }]
                                     (let [res (s/conform (read-spec params) body)]
                                       (if (not= :clojure.spec.alpha/invalid res)
                                         (response res)
                                         (response (s/explain-data (read-spec params) body)))))})}]]]]))

(defmethod ig/init-key :dev.endpoints/spec  [_ opts]
  (routes opts))

(defmethod ig/init-key :dev.endpoints/spec-api  [_ {:keys [path middleware routes] :as opts}]
  [path {:middleware middleware} routes])

(comment
  "Adding some dev specs tests around here"
  (do

    (require '[akvo.lumen.endpoints-test.commons :refer (get* post*)]
             '[integrant.repl.state :as state :refer (system)])
    
    (let [spec :akvo.lumen.lib.aggregation/dataset
          h (:handler (:akvo.lumen.component.handler/handler system))
          r (-> (get*  (str "/spec/describe/" spec))
                (assoc-in [:headers "content-type"] "application/transit+json")
                h)

          res (dev.transit/read-transit (:body r))]
      (assert (=
               {:namespace "akvo.lumen.lib.aggregation",
                :id "dataset",
                :ns :akvo.lumen.lib.aggregation/dataset
                :spec
                '(keys
                  :req-un
                  [:akvo.lumen.specs.db.dataset-version/columns
                   :akvo.lumen.specs.db.dataset-version/table-name])}
               res
               (describe-spec-response spec)))
      res)
    
    (let [spec :akvo.lumen.specs.transformation/command
          h (:handler (:akvo.lumen.component.handler/handler system))
          r (-> (get*  (str "/spec/sample/" spec))
                (assoc-in [:headers "content-type"] "application/transit+json")
                h)

          res (dev.transit/read-transit (:body r))]
      (assert (= res (s/conform spec res)))
      res)

    (let [spec :akvo.lumen.specs.transformation/command
          h (:handler (:akvo.lumen.component.handler/handler system))
          body* {:type :undo}
          r (-> (post*  (str "/spec/conform/" spec) {})
                (assoc-in [:headers "content-type"] "application/transit+json")
                (assoc :body  (io/reader (dev.transit/input-stream  (dev.transit/output-stream body*))))
                h)
          res (dev.transit/read-transit (:body r))]
      (assert (= body* res))
      res))
  )



