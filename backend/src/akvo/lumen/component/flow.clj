(ns akvo.lumen.component.flow
  "wrap flow and flow api logic and data related"
  (:require [integrant.core :as ig]
            [akvo.lumen.component.keycloak :as c.keycloak]
            [clj-http.client :as http]
            [clojure.tools.logging :as log]
            [clojure.spec.alpha :as s]))

(defn access-token
  "Fetch a new access token using a refresh token"
  [this refresh-token]
  (let [token-endpoint (format "%s/realms/%s/protocol/openid-connect/token"
                               (-> this :keycloak :url)
                               (-> this :keycloak :realm))]
    (-> (http/post token-endpoint
                   {:form-params {"client_id" "akvo-lumen"
                                  "refresh_token" refresh-token
                                  "grant_type" "refresh_token"}
                    :as :json})
        :body
        :access_token)))


(defn api-headers
  [token]
  {"Authorization" (format "Bearer %s" token)
   "User-Agent" "lumen"
   "Accept" "application/vnd.akvo.flow.v2+json"})

(defn check-permissions
  [flow-api token body]
  (try
    (http/post
     (str (:url flow-api) "/check_permissions")
     {:as :json
      :headers (api-headers token)
      :form-params body
      :content-type :json})
    (catch Exception e (log/error :fail body (.getMessage e)))))


(defmethod ig/init-key ::api  [_ {:keys [url] :as opts}]
  opts)

(s/def ::url string?)
(s/def ::keycloak :akvo.lumen.component.keycloak/data)
(s/def ::config (s/keys :req-un [::url ::keycloak]))

(defmethod ig/pre-init-spec ::api [_]
  ::config)

(defn >api-model [ds-source]
  (let [instance (get ds-source "instance")
        survey (get ds-source "surveyId")]
    {:instance_id (if (= "uat1" instance) (str "akvoflow-" instance) instance)
     :survey_id survey}))
