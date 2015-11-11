(ns akvo-dash.http
  (:require [compojure.core :refer (GET defroutes)]
            [compojure.route :as route]
            [ring.adapter.jetty :refer (run-jetty)]
            [ring.util.response :refer (redirect)]
            [ring.middleware.params :refer (wrap-params)]
            [ring.middleware.keyword-params :refer (wrap-keyword-params)]
            [ring.middleware.session :refer (wrap-session)]
            [clj-http.client :as http]
            [clojure.data.csv :as csv]
            [clojurewerkz.elastisch.rest.document :as esd]
            [clojurewerkz.elastisch.rest :as es]
            [cheshire.core :refer (parse-string)]))

(def token-uri "https://api.dropboxapi.com/1/oauth2/token")
(def redirect-uri "http://localhost:3000/dropbox-auth-finish")
(def auth-uri "https://www.dropbox.com/1/oauth2/authorize?locale=en_US&client_id=%s&response_type=code&redirect_uri=%s&state=%s")

(def client-id "")
(def client-secret "")

(def token (atom {:access-token nil}))


(defroutes app
  (GET "/" [] "OK")
  (GET "/dropbox-auth" []
    (redirect (format auth-uri client-id redirect-uri "0"))) ;;FIXME: proper state handling
  (GET "/dropbox-auth-finish" req
    (prn req)
    (let [code (get-in req [:params "code"])
          resp (http/post token-uri {:debug true
                                      :debug-body true
                                      :basic-auth [client-id client-secret]
                                      :form-params {:code code
                                                    :grant_type "authorization_code"
                                                    :redirect_uri redirect-uri}})
          tkn (parse-string (:body resp))]
      (swap! token assoc :access-token (tkn "access_token")))
    "OK")
  (GET "/download" []
    (let [resp (http/post "https://content.dropboxapi.com/2/files/download"
                          {:debug true
                           :debug-body true
                           :oauth-token (:access-token @token)
                           :content-type ""
                           :headers {:Dropbox-API-Arg "{\"path\": \"/akvo/6. Development/Akvo DASH/Architecture/Managers.csv\"}"} ;;FIXME
                           :form-params {}})
          data (csv/read-csv (:body resp))
          header (map keyword (first data))
          docs (for [d (drop 1 data)]
                 (apply assoc {} (interleave header d)))
          conn (es/connect "http://localhost:9200")]
      (doseq [d docs]
        (esd/create conn "dash" "manager" d)))
    "OK")
  (route/not-found "Page not found"))

(defn srv
  []
  (run-jetty (-> #'app
                 wrap-session
                 wrap-params
                 wrap-keyword-params) {:port 3000 :join? false}))