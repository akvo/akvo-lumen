(ns akvo.lumen.lib.export
  (:require [akvo.lumen.lib :as lib]
    [cheshire.core :as json]
    [clj-http.client :as http]))


(defn export
  [api-root {:strs [format target title token, refresh_token, id] :as query}]
  (-> (clojure.core/format "%s/screenshot?format=%s&title=%s&token=%s&refresh_token=%s&id=%s&target=%s"
                           "http://exporter.lumen.local:3001"
                           format
                           title
                           token
                           refresh_token
                           id
                           target)
      (http/get)
      :body))
