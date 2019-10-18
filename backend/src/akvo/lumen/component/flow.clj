(ns akvo.lumen.component.flow
  "wrap flow and flow api logic and data related"
  (:require [akvo.lumen.http.client :as http.client]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]
            [clojure.spec.alpha :as s]))

(def http-client-req-defaults (http.client/req-opts 5000))

(def commons-api-headers
  {"User-Agent" "lumen"
   "Accept" "application/vnd.akvo.flow.v2+json"})

(defn api-headers
  "JWT token required thus the call could be used externally"
  [{:keys [token]}]
  (merge commons-api-headers {"Authorization" (format "Bearer %s" token)}))

(defn internal-api-headers
  "No authorization is required thus it's an internal owned k8s call"
  [{:keys [email]}]
  (merge commons-api-headers {"X-Akvo-Email" email}))

(defmethod ig/init-key ::api-headers  [_ _]
  api-headers)

(defmethod ig/init-key ::internal-api-headers  [_ _]
  internal-api-headers)

(defmethod ig/pre-init-spec ::api-headers [_]
  empty?)

(defmethod ig/pre-init-spec ::internal-api-headers [_]
  empty?)

(defn check-permissions
  [flow-api-url token body]
  (let [start (. System (nanoTime))
        headers (api-headers {:token token})
        res (try
              (http.client/post*
               (str flow-api-url "/check_permissions")
               (merge http-client-req-defaults
                      {:as :json
                       :headers headers
                       :throw-entire-message? true
                       :unexceptional-status #(<= 200 % 299)
                       :form-params body
                       :content-type :json}))
              (catch Exception e
                (log/error e :fail :url flow-api-url :body body
                           :response (ex-data e))))]
    (let [elapsed (/ (double (- (. System (nanoTime)) start)) 1000000.0)]
      (log/debug ::check-permissions :body body :res res
                 :elapsed-time (str "Elapsed time: " elapsed " msecs")))
    res))

(defmethod ig/init-key ::api  [_ {:keys [url] :as opts}]
  opts)

(s/def ::url string?)
(s/def ::internal-url string?)
(s/def ::api-headers fn?)
(s/def ::internal-api-headers fn?)
(s/def ::config (s/keys :req-un [::url ::internal-url ::api-headers
                                 ::internal-api-headers]))

(defmethod ig/pre-init-spec ::api [_]
  ::config)

(defn >api-model [ds-source]
  (let [instance (get ds-source "instance")
        survey (get ds-source "surveyId")]
    {:instance_id instance
     :survey_id survey}))
