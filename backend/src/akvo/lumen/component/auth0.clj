(ns akvo.lumen.component.auth0
  "moving to auth0"
  (:require [akvo.commons.jwt :as jwt]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.protocols :as p]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [integrant.core :as ig]
            [clojure.spec.alpha :as s]
            [clojure.set :as set]
            [clojure.tools.logging :as log]
            [ring.util.response :refer [response]]))

(defmethod ig/init-key :akvo.lumen.component.auth0/data  [_ {:keys [url] :as opts}]
  (try
    (let [issuer (format "%s/" url)
          rsa-key  (-> (format  "%s.well-known/jwks.json" issuer)
                             client/get
                             :body
                             (jwt/rsa-key 0))]
      (assoc opts
             :issuer issuer
             :rsa-key rsa-key))
    (catch Exception e
      (log/error e "Could not get cert from auth0")
      (throw e))))

(s/def ::url string?)

(s/def ::data (s/keys :req-un [::url]))

(defmethod ig/pre-init-spec :akvo.lumen.component.auth0/data [_]
  ::data)
