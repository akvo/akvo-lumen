(ns akvo.lumen.lib.export
  (:require [akvo.lumen.lib :as lib]
    [cheshire.core :as json]
    [clj-http.client :as http]))


(defn export
  [api-root {:strs [format target] :as query}]
  (println api-root format target query)
  (-> (clojure.core/format "%s/%s?target=%s"
              api-root format target)
      (http/get)
      :body))
