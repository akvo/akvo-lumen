(ns akvo.lumen.http.client
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

(defn req-opts
  "All these timeouts are in milliseconds
  :connection-timeout - time to establish the socket
  :connection-request-timeout - time to have a free socket
  :socket-timeout - time to get the response"
  [socket-timeout]
  {:connection-timeout 2000 :connection-request-timeout 50 :socket-timeout socket-timeout})

(def req-pre-condition #(and (some? (:connection-timeout %))
                             (some? (:connection-request-timeout %))
                             (some? (:socket-timeout %))))
(defn get* [url opts]
  {:pre [(req-pre-condition opts)]}
  (client/get url opts))

(defn post* [url opts]
  {:pre [(req-pre-condition opts)]}
  (client/post url opts))

(defn put* [url opts]
  {:pre [(req-pre-condition opts)]}
  (client/put url opts))

(defn delete* [url opts]
  {:pre [(req-pre-condition opts)]}
  (client/delete url opts))
