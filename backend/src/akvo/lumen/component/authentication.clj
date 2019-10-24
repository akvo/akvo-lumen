(ns akvo.lumen.component.authentication
  (:require [akvo.commons.jwt :as jwt]
            [akvo.lumen.http.client :as http.client]
            [akvo.lumen.lib :as lib]
            [cheshire.core :as json]
            [akvo.lumen.protocols :as p]
            [cheshire.core :as json]
            [integrant.core :as ig]
            [clojure.spec.alpha :as s]
            [clojure.set :as set]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [ring.util.response :refer [response]]))

(def http-client-req-defaults (http.client/req-opts 5000))

(defmethod ig/init-key :akvo.lumen.component.authentication/public-client  [_ {:keys [url issuer-suffix-url rsa-suffix-url client-id] :as opts}]
  (try
    (let [issuer         (format "%s%s" url issuer-suffix-url)
          rsa-key        (-> (format  "%s%s" issuer rsa-suffix-url)
                             (http.client/get* http-client-req-defaults)
                             :body
                             (jwt/rsa-key 0))
          open-id-config (-> (format  "%s%s" issuer "/.well-known/openid-configuration")
                             (http.client/get* http-client-req-defaults)
                             :body
                             (json/parse-string true))]
      (assoc opts
             :open-id-config open-id-config
             :issuer issuer
             :rsa-key rsa-key))
    (catch Exception e
      (log/error e (str "Could not get cert from " url))
      (throw e))))

(s/def ::url string?)
(s/def ::issuer-suffix-url string?)
(s/def ::rsa-suffix-url string?)
(s/def ::client-id string?)
(s/def ::end-session-endpoint-suffix string?)


(s/def ::public-client (s/keys :req-un [::url ::client-id ::issuer-suffix-url ::rsa-suffix-url
                                        ::end-session-endpoint-suffix]))

(defmethod ig/pre-init-spec :akvo.lumen.component.authentication/public-client [_]
  ::public-client)
