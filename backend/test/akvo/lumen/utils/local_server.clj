(ns akvo.lumen.utils.local-server
  (:require [clojure.tools.logging :as log]
            [clojure.java.io :as io]
            [integrant.core :as ig]))

(defn routes [{:keys [routes-opts] :as opts}]
  ["/local-server" routes-opts
   ["/:file" ["" {:get {:parameters {:path-params {:file string?}}
                        :handler (fn [{tenant :tenant
                                       {:keys [file]} :path-params}]
                                   {:status  200
                                    :headers {"Content-Type" "text/plain"}
                                    :body    (slurp (io/resource file))})}}]]])

(defmethod ig/init-key :akvo.lumen.utils.local-server/endpoint  [_ opts]
  (routes opts))
