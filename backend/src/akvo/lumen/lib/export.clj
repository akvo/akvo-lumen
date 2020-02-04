(ns akvo.lumen.lib.export
  (:require [clojure.string :as str]
            [clojure.tools.logging :as log]
            [akvo.lumen.http.client :as http.client]))

(def http-client-req-defaults (http.client/req-opts 120000))

(defmacro time*
  "Evaluates expr and prints the time it took.  Returns the value of
 expr."
  {:added "1.0"}
  [expr]
  `(let [start# (. System (nanoTime))
         ret# ~expr]
     (log/info (str "Elapsed time: " (/ (double (- (. System (nanoTime)) start#)) 1000000.0) " msecs"))
     ret#))

(defn export
  "Proxy fn, exporter-url token exporter spec -> ring response map"
  [exporter-url access-token locale spec]
  (let [{:keys [body headers status] :as response}
        (time* (http.client/post* exporter-url
                                  (merge http-client-req-defaults 
                                         {:headers {"access_token" (str/replace-first access-token
                                                                                      #"Bearer "
                                                                                      "")
                                                    "locale" locale}
                                          :form-params spec
                                          :content-type :json
                                          :throw-exceptions false})))]
    (log/info :response-without-body (dissoc response :body))
    {:body body
     :headers {"Content-Type" (get headers "Content-Type")
               "Content-Disposition" (get headers "Content-Disposition")}
     :status status}))
