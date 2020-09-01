(ns akvo.lumen.lib.import.common
  (:require [clojure.java.io :as io]
            [akvo.lumen.protocols :as p]
            [org.akvo.resumed :as resumed]))

(def rows-limit 500000)

(defn importer-type [spec]
  (get spec "kind"))

(defn- dispatch-on-kind [spec]
  (let [kind (importer-type spec)]
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
             :groupId (:groupId q)
             :metadata (:metadata q)
             :groupName (:groupName q)
             :namespace (:namespace q)
             :id (format "c%s" (:id q))}
            (when (= t "multiple")
              (if (:caddisflyResourceUuid q)
                {:multipleType "caddisfly"
                 :multipleId (:caddisflyResourceUuid q)}
                {:multipleType (:multipleType q)
                 :multipleId (:multipleId q)})))))
       questions))

(defn extract-first-and-merge
  "extract every first group-responses into one `main` response"
  [ns-responses]
  (->> ns-responses
       (group-by #(:namespace (meta %)))
       vals
       (map first)
       (reduce merge {})))
