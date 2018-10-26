(ns akvo.lumen.lib.export
  (:require [clojure.string :as str]
            [clj-http.client :as client]))

(defn export
  "Proxy fn, exporter-url token exporter spec -> ring response map"
  [exporter-url access-token locale spec]
  (let [{:keys [body headers status]}
        (client/post exporter-url
                     {:headers {"access_token" (str/replace-first access-token
                                                                  #"Bearer "
                                                                  "")
                                "locale" locale}
                      :form-params spec
                      :content-type :json})]
    {:body body
     :headers {"Content-Type" (get headers "Content-Type")
               "Content-Disposition" (get headers "Content-Disposition")}
     :status status}))
