(ns org.akvo.dash.import
  (:require [clj-http.client :as client]))


(defn ensure-directory [dir]
  (.mkdirs (io/file dir)))

;; Persist file, S3 or whatnot. How do we set option?


(defmethod do-import :default [t]
  (throw (IllegalArgumentException.
          (str "Can't import task of kind" (:kind t)))))

(defmulti do-import
  "Import based on connection kind of task."
  (fn [t] (:kind t)))

(defmethod do-import "LINK" [{{url :url} :spec}]
  (prn url)
  (let [resp (client/get url)
        file (:body resp)
        content-type (get-in resp [:headers "Content-Type"])
        content-length (get-in resp [ :headers "Content-Length"])]
    (prn content-type)
    (prn content-length)
    (prn file)))

(defmethod do-import "AKVO-FLOW" [t]
  (prn "was of type FLOW"))

(defmethod do-import :default [t]
  (throw (IllegalArgumentException.
          (str "Can't import task of kind" (:kind t)))))


;; How do we store files?
;; Each teneant with it's own dir / bucket?
;; What do we use as unique filename - depends on overall data model

(defn job
  ""
  [task]
  (do-import task)
  ;; Create/update dataset with new data
  )
