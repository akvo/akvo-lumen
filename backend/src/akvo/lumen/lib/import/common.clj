(ns akvo.lumen.lib.import.common
  (:require [clojure.java.io :as io]
            [akvo.lumen.protocols :as p]
            [org.akvo.resumed :as resumed]))

(defn- dispatch-on-kind [spec]
  (let [kind (get spec "kind")]
    (if (#{"LINK" "DATA_FILE"} kind)
      "CSV" ;; TODO: Unify elsewhere
      kind)))

(defmulti dataset-importer
  "Creates a DatasetImporter according to the spec"
  (fn [spec config]
    (dispatch-on-kind spec)))

(defn get-path
  [spec file-upload-path]
  (or (get spec "path")
      (let [file-on-disk? (contains? spec "fileName")
            url (get spec "url")]
        (if file-on-disk?
          (resumed/file-for-upload file-upload-path url)
          (let [url (io/as-url url)]
            (when-not (#{"http" "https"} (.getProtocol url))
              (throw (ex-info (str "Invalid url: " url) {:url url})))
            url)))))

(defn coerce [type-fun questions]
  (map (fn [q]
         (let [t (type-fun q)]
           (merge
            {:title (:name q)
             :type t
             :id (format "c%s" (:id q))}
            (when (= t :multiple)
              (if (:caddisflyResourceUuid q)
                {:multipleType :caddisfly
                 :multipleId (:caddisflyResourceUuid q)}
                {:multipleType :unknown
                 :multipleId nil})))))
       questions))
