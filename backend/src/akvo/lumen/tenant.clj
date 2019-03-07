(ns akvo.lumen.tenant
  (:require [clojure.string :as str]))


(defn tenant-host [host]
  (-> host
      (str/replace-first #"^dark-" "")
      (str/split #"\.")
      first))

