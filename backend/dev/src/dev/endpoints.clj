(ns dev.endpoints
  (:require [clojure.tools.logging :as log]
            [clojure.java.io :as io]
            [clojure.spec.alpha :as s]
            [cognitect.transit :as transit]
            [akvo.lumen.specs :as lumen.s]
            [ring.util.response :refer [response]]
            [integrant.core :as ig])
  (:import [java.io ByteArrayInputStream ByteArrayOutputStream]))
;; working in adapt https://github.com/akvo/akvo-lumen/blob/310bd7cbc3221bf889ad592f2d9e91a572f06c00/backend/dev/src/akvo/lumen/local_server.clj
;; use edn middleware instead of json middleware

(defn describe-spec-response [spec]
  {:namespace (namespace spec)
   :id (name spec)
   :ns (keyword spec)
   :spec (s/describe spec)})



(defn routes [opts]
  (let [params {:parameters {:path-params {:spec-ns string?
                                           :spec-id string?}}}
        read-spec (fn [{:keys [spec-ns spec-id]}]
                    (keyword (str (apply str (next (seq spec-ns))) "/" spec-id)))
        ]
    
    [["/sample"
       ["/:spec-ns/:spec-id"
        ["" {:get (merge params
                         {:handler (fn [{params :path-params}]
                                     (response (lumen.s/sample (read-spec params))))})}]]]
     ["/describe"
       ["/:spec-ns/:spec-id"
        ["" {:get (merge params
                         {:handler (fn [{params :path-params}]
                                     (response (describe-spec-response (read-spec params))))})}]]]]))

(defmethod ig/init-key :dev.endpoints/spec  [_ opts]
  (routes opts))

(defmethod ig/init-key :dev.endpoints/spec-api  [_ {:keys [path middleware routes] :as opts}]
  [path {:middleware middleware} routes])

(defmethod ig/init-key :dev.endpoints/middleware  [_ opts]
  (fn [handler]
    (fn [req]
      (let [res (handler req)]
        (if (= "application/transit+json" (get-in req [:headers "content-type"]))
          (let [out (ByteArrayOutputStream. 4096)
                writer (transit/writer out :json)]
            (transit/write writer (:body res))
            (assoc res :body out))
          res)))))


(comment
  (do
    (require '[akvo.lumen.endpoints-test.commons :refer (get* patch* del* post* put* body-kw job-execution-dataset-id post-files api-url)]
             '[integrant.repl.state :as state :refer (system)])
    (let [spec :akvo.lumen.lib.aggregation/dataset
          h (:handler (:akvo.lumen.component.handler/handler system))
          r (-> (get*  (str "/spec/describe/" spec))
                (assoc-in [:headers "content-type"] "application/transit+json")
                h)
          f* (fn [out] (ByteArrayInputStream. (.toByteArray out)))
          res (-> (:body r)
                  f*
                  (transit/reader :json)
                  (transit/read))]
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
      res))
  )


