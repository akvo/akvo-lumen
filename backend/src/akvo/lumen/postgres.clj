(ns akvo.lumen.postgres
  (:require [clojure.string :as str]))

(defn escape-string [s]
  (when-not (nil? s)
    (when-not (string? s)
      (throw (ex-info "Not a string" {:s s})))
    (str/replace s "'" "''")))
