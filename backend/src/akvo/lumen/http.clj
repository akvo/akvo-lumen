(ns akvo.lumen.http
  "wrapping http client calls so we have robust settings values"
  (:require
   [clj-http.client :as client]
   [clj-http.conn-mgr :as http.conn-mgr]))

(defn- default-connection-manager-opts
  ":timeout - Time that connections are left open before automatically closing ... in seconds" 
  [opts]
  (merge {:timeout 10 :threads 2 :insecure? false :default-per-route 2}
         (select-keys opts [:timeout :threads :insecure? :default-per-route])))

(defn new-connection-manager
  ([] (new-connection-manager {}))
  ([opts]
   (http.conn-mgr/make-reusable-conn-manager (default-connection-manager-opts opts))))


(defn shutdown-manager [connection-manager]
    (http.conn-mgr/shutdown-manager connection-manager))

(def default-req-opts
  "
  All these timeouts are in milliseconds
  :connection-timeout - time to establish the socket
  :connection-request-timeout - time to have a free socket
  :socket-timeout - time to get the response" 
  {:connection-timeout 2000 :connection-request-timeout 50 :socket-timeout 5000})

(defn get* [url & [opts]]
  (client/get url (merge default-req-opts opts)))

(defn post* [url & [opts]]
  (client/post url (merge default-req-opts opts)))

(defn put* [url & [opts]]
  (client/put url (merge default-req-opts opts)))

(defn delete* [url & [opts]]
  (client/delete url (merge default-req-opts opts)))
