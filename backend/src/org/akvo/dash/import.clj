(ns org.akvo.dash.import
  "WIP
  We talk about pristine & noble files. Could not come up with better naming
  of the raw import and the one where we have:
  [{:header \"Column1\" :kind \"STRING\" :values []}]
  Pristine came to mind and noble just fell out of 'refined' from the
  dictionary."
  (:require
   ;; [camel-snake-kebab.core :refer [->kebab-case ->snake_case]]
   [cheshire.core :as json]
   [clj-http.client :as client]
   [clojure.data.csv :as csv]
   [clojure.pprint :refer [pprint]]
   [clojure.java.io :as io]
   [clojure.string :as str]
   [hugsql.core :as hugsql]
   [pandect.algo.sha1 :refer [sha1]]
   [org.akvo.dash.transformation :as t]))


(hugsql/def-db-fns "org/akvo/dash/import.sql")



(defn ensure-directory [dir]
  (.mkdirs (io/file dir)))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Download
;;;

(defmulti yank
  "Download content based on spec."
  (fn [datasource] (get-in datasource [:spec "kind"])))

(defmethod yank :default [datasource]
  (throw (IllegalArgumentException.
          (str "Can't download file of "
               (get-in datasource [:spec "kind"]) " kind."))))

(defmethod yank "LINK" [{spec :spec}]
  (let [url  (get spec "url")
        resp (client/get url)
        data (:body resp)]
    {:data           data
     :content-length (get-in resp [:headers "Content-Length"])
     :content-type   (get-in resp [:headers "Content-Type"])
     :digest         (sha1 data)
     :file-extension (last (str/split url #"\."))}))

(defmethod yank "DATA_FILE" [datasource]
  (let [url       (get-in datasource [:spec "url"])
        ;; file-name (get-in datasource [:spec "fileName"])
        file-id   (last (str/split url
                                   #"\/"))
        data      (slurp (str "/tmp/akvo/dash/" "resumed/" file-id "/file"))]
    {:data           data
     :digest         (sha1 data)
     :file-extension (last (str/split (get-in datasource [:spec "fileName"])
                                      #"\."))}))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Persist
;;;

(defmulti persist-content
  "Persist file according to config."
  (fn [config _ _] (:kind config)))

(defmethod persist-content :default [config _ _]
  (throw (IllegalArgumentException.
          (str "Can't store pristine file with config" (:kind config)))))

(defmethod persist-content "DISK" [{path :path
                                    kind :kind}
                                   bucket
                                   {data      :data
                                    digest    :digest
                                    extension :file-extension}]
  (let [d    (str path "/" (name bucket))
        file (str d "/" digest "." extension)]
    (ensure-directory d)
    (spit file data)
    {:kind  kind
     bucket file}))


(defmulti ->noble
  "Transform from pristine format to json in noble format."
  (fn [content] (:file-extension content)))

(defmethod ->noble :default [content]
  (throw (IllegalArgumentException.
          (str "Can't make file of type " (:file-extension content) " noble."))))

(defmethod ->noble "csv" [content]
  (-> (csv/read-csv (:data content))
      t/parse-csv-with-headers
      json/generate-string))


(defn handle-new-revision
  "
  1. perist pristine
  2. perist noble
  3. insert new revision
  4. update import"
  [db content id]
  (let [config {:kind "DISK" :path "/tmp/akvo/dash"}
        p      (persist-content config :pristine content)
        n      (persist-content config
                                :noble
                                {:data           (->noble content)
                                 :digest         (:digest content)
                                 :file-extension "json"})]
    (insert-revision db
                     {:content-type (:file-extension content)
                      :digest       (:digest content)
                      :noble        n
                      :pristine     p})
    (update-import-with-revision db
                                 {:digest (:digest content)
                                  :id     id
                                  :status "OK"})))


(defn do-import
  ""
  [db datasource id]
  (try
    (let [content (yank datasource)]
      (if (not (nil? (revision-digest-by-digest db content)))
        (update-import-with-revision db
                                     (assoc content
                                            :id id
                                            :status "OK"))
        (handle-new-revision db
                             content id)))
    (catch Exception e
      (pprint e)
      (pprint (.getNextException e))
      (update-import-status db
                            {:id     id
                             :status "FAILED"})
      (throw (Exception. "Coudl not handle file upload")))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; API
;;;

(defn job
  "An import job.
  1. First grab import spec from task.
  2. Try and download content. If we fail mark the import as failed.
  3. Figure out if we already have downloaded that file.
  4. If we don't have the file follow path A otherwise path B.

  A1. Persist the raw (pristine) file.
  A2. Create & store a json version in a prefered format (noble)
  A3. Update the revisions table with the new file.
  A4. Update the import with the new revision and set status to OK

  B1. Update the import with the already existing revision and set status to OK.

  D. Things fail and we mark the import as FAIL. Maybe we should add a reason."
  [db id]
  (try
    (do-import db
               (datasource-by-import db
                                     {:id id})
               id)
    (catch Exception e
      (pprint e)
      (pprint (.getNextException e)))))
