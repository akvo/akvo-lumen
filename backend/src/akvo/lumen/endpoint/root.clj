(ns akvo.lumen.endpoint.root
  (:require [integrant.core :as ig]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [ring.util.response :refer [response]]))

(defn handler [{:keys [tenant-manager]}]
  (fn [request]
    (let [base-url (str (-> request :scheme name)
                        "://" (:server-name request)
                        ":" (:server-port request)
                        (:uri request) "/")]
      (response
       {:help      (str "To access the API endpoints a valid authorization "
                        "header needs to be provided.")
        :tenant    (:tenant request)
        :resources {:datasets       (str base-url "datasets")
                    :shares         (str base-url "shares")
                    :visualisations (str base-url "visualisations")}}))))

(defn routes [{:keys [tenant-manager] :as opts}]
  [""
   {:get {:responses {200 {}}
          :handler (handler opts)}}])

(defmethod ig/init-key :akvo.lumen.endpoint.root/root  [_ opts]
  (routes opts))

(defmethod integrant-key :akvo.lumen.endpoint.root/root [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager] )))
