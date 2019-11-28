(ns akvo.lumen.endpoints-test.commons
  (:require [clojure.string :as str]
            [cheshire.core :as json]
            [clojure.test :refer (is)]
            [diehard.core :as dh]
            [clojure.java.io :as io])
  (:import [java.io ByteArrayInputStream]))

(def dataset-link-columns [{:key false,
                            :type "text",
                            :title "Name",
                            :multipleId nil,
                            :hidden false,
                            :multipleType nil,
                            :columnName "c1",
                            :groupId nil
                            :groupName nil
                            :direction nil,
                            :sort nil}
                           {:key false,
                            :type "number",
                            :title "Age",
                            :multipleId nil,
                            :hidden false,
                            :multipleType nil,
                            :groupId nil
                            :groupName nil
                            :columnName "c2",
                            :direction nil,
                            :sort nil}
                           {:key false,
                            :type "number",
                            :title "Score",
                            :multipleId nil,
                            :hidden false,
                            :multipleType nil,
                            :groupId nil
                            :groupName nil
                            :columnName "c3",
                            :direction nil,
                            :sort nil}
                           {:key false,
                            :type "number",
                            :title "Temperature",
                            :multipleId nil,
                            :hidden false,
                            :groupId nil
                            :groupName nil
                            :multipleType nil,
                            :columnName "c4",
                            :direction nil,
                            :sort nil}
                           {:key false,
                            :type "number",
                            :title "Humidity",
                            :multipleId nil,
                            :hidden false,
                            :multipleType nil,
                            :columnName "c5",
                            :groupId nil
                            :groupName nil
                            :direction nil,
                            :sort nil}
                           {:key false,
                            :type "text",
                            :title "Cat",
                            :multipleId nil,
                            :hidden false,
                            :groupId nil
                            :groupName nil
                            :multipleType nil,
                            :columnName "c6",
                            :direction nil,
                            :sort nil}])

;; Todo: generate it with current vis + aggregation specs!!
(defn visualisation-payload [dataset-id vis-type name*]
  {:type "visualisation",
   :name name*,
   :visualisationType vis-type
   :datasetId dataset-id
   :spec {:metricColumnX nil,
          :horizontal false,
          :metricAggregation "count",
          :filters [],
          :axisLabelYFromUser false,
          :bucketColumn nil,
          :showLabels false,
          :metricColumnY nil,
          :subBucketMethod "split",
          :subBucketColumn nil,
          :truncateSize nil,
          :axisLabelX nil,
          :legendTitle nil,
          :axisLabelXFromUser false,
          :axisLabelY nil,
          :version 1,
          :sort nil,
          :showValueLabels false}})

(def tenant-host "http://t1.lumen.local:3030")

(defn api-url [api-url & args]
  (str  "/api" api-url (when args (str "/" (str/join "/"  args)))))

(defn with-body [method uri body & [query-params multipart-params]]
  (cond->
      {:request-method method
       :uri uri
       :headers {"host" "t1.lumen.local:3030" "content-type" "application/json"}
       :path-info uri
       :server-port 3030,
       :server-name "t1.lumen.local",
       :remote-addr "localhost",
       :scheme :http,
       :body (io/reader (io/input-stream (.getBytes (json/generate-string body))))}
    query-params (assoc :query-params query-params)
    multipart-params (assoc :multipart-params multipart-params)))

(defn post* [uri body & args]
  (apply with-body :post uri body args))

(defn put* [uri body & args]
  (apply with-body :put uri body args))

(defn >get* [method uri [query-params]]
  (cond->
      {:request-method method
       :server-port 3030,
       :server-name "t1.lumen.local",
       :path-info uri
       :remote-addr "localhost",
       :scheme :http,
       :headers {"host" "t1.lumen.local:3030" "content-type" "application/json"}
       :uri uri}
    query-params (assoc :query-params query-params)))

(defn get* [uri & more]
  (>get* :get uri more))

(defn patch* [uri body & args]
  (apply with-body :patch uri body args))

(defn del* [uri & more]
  (>get* :delete uri more))

(defn body-kw [res]
  (-> res :body (json/parse-string keyword)))

(defn job-execution-dataset-id [h job-id & [k jb-type]]
  (dh/with-retry {:retry-if (fn [v e] (not v))
                  :max-retries 2000
                  :delay-ms 100}
    (let [job (-> (h (get* (api-url "/job_executions" (or jb-type "dataset") job-id)))
                  body-kw)
          status (:status job)]
      (when (= "OK" status)
        ((if k k :datasetId) job)))))

(defn io-file [path]
  (io/file (io/resource path)))

(defn res-to-byte-array
  "modified version of from https://github.com/akvo/resumed/blob/master/test/org/akvo/resumed_test.clj#L12-L21
  until https://github.com/akvo/resumed/issues/11 should be fixed"
  ([f off len]
   (let [ba (byte-array  len)
         is (io/input-stream f)]
     (.skip is off)
     (.read is ba 0 len)
     (.close is)
     ba))
  ([f]
   (let [ba (byte-array (.length f))
         is (io/input-stream f)]
     (.read is ba)
     (.close is)
     ba)))

(defn post-files [h file-name]
  (let [file     (io-file file-name)
        length*  (.length file)
        res      (h (update (post*  (api-url "/files") {})
                            :headers #(assoc %
                                             "upload-metadata" (str "filename " file-name)
                                             "upload-length" (str length*))))
        location (get-in res [:headers "Location"])
        loc      (str/replace location "http://t1.lumen.local:3030/api" "")]
    (is (= 201 (:status res)))
    (let [content-length 1048576]
      (loop [length   length*
             uploaded 0
             it       0]
        (when (pos? length)
          (let [diff           (- length content-length)
                content-length (if (pos? diff) content-length length)
                ba             (-> (io-file file-name)
                                   (res-to-byte-array uploaded  content-length)
                                   (ByteArrayInputStream.))]
            (let [resp (h (-> (patch*  (api-url loc) {})
                              (assoc :content-length content-length)
                              (assoc :body ba)
                              (update :headers #(assoc %
                                                       "content-type" "application/offset+octet-stream"
                                                       "content-length" (str content-length)
                                                       "upload-offset" (str uploaded)))))]
              (if (= 204 (:status resp))
                (recur diff (+ uploaded content-length) (inc it))))))))
    location))
