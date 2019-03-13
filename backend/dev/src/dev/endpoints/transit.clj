(ns dev.endpoints.transit
  (:require [clojure.tools.logging :as log]
            [clojure.java.io :as io]
            [clojure.spec.alpha :as s]
            [cognitect.transit :as transit]
            [akvo.lumen.specs :as lumen.s]
            [ring.util.response :refer [response]]
            [integrant.core :as ig])
  (:import [java.io ByteArrayInputStream ByteArrayOutputStream]
           [org.apache.commons.io.input ReaderInputStream]))

(defn transit-stream [s]
  (let [out (ByteArrayOutputStream. 4096)
        writer (transit/writer out :json)]
    (transit/write writer s)
    out))

(defn parse-transit-stream [out]
  (ByteArrayInputStream. (.toByteArray out)))

(defn transit-body [body]
  (-> body parse-transit-stream (transit/reader :json) (transit/read)))

(defmethod ig/init-key ::middleware  [_ opts]
  (fn [handler]
    (fn [req]
      (if (= "application/transit+json" (get-in req [:headers "content-type"]))
        (let [b (when (:body req)
                  (-> (:body req)
                      (ReaderInputStream. )
                      (transit/reader :json)
                      (transit/read)))
              req (assoc req :body b)
              res (handler req)]
          (assoc res :body (transit-stream (:body res))))
        (handler req)))))
