(ns dev.endpoints
  (:require [clojure.tools.logging :as log]
            [clojure.java.io :as io]
            [clojure.spec.alpha :as s]
            [ring.util.response :refer [response]]
            [integrant.core :as ig]))
;; working in adapt https://github.com/akvo/akvo-lumen/blob/310bd7cbc3221bf889ad592f2d9e91a572f06c00/backend/dev/src/akvo/lumen/local_server.clj
;; use edn middleware instead of json middleware
(defn routes [opts]
  ["/:spec-ns/:spec-id" ["" {:get {:parameters {:path-params {:spec-ns string?
                                                              :spec-id string?}}
                                   :handler (fn [{{:keys [spec-ns spec-id]} :path-params}]
                                              (let [spec (keyword (str (apply str (next (seq spec-ns))) "/" spec-id))]
                                                (response {:namespace spec-ns
                                                  :id spec-id
                                                  :ns spec
                                                  :spec (s/describe spec)})))}}]])

(defmethod ig/init-key :dev.endpoints/spec  [_ opts]
  (routes opts))
