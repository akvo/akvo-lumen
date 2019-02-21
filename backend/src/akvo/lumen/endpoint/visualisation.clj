(ns akvo.lumen.endpoint.visualisation
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.lib.visualisation.maps :as maps]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [clojure.walk :as w]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [windshaft-url tenant-manager]}]

  (context "/api/visualisations" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]
      (GET "/" _
        (visualisation/all tenant-conn))

      (POST "/" {:keys [jwt-claims body]}
        (visualisation/create tenant-conn body jwt-claims))

      (context "/maps" _
        (POST "/" {{:strs [spec]} :body}
          (let [layers (get-in spec ["layers"])]
            (maps/create tenant-conn windshaft-url (w/keywordize-keys layers)))))

      (context "/rasters" _
        (POST "/" {{:strs [rasterId spec]} :body}
          (maps/create-raster tenant-conn windshaft-url rasterId)))

      (context "/:id" [id]

        (GET "/" _
          (visualisation/fetch tenant-conn id))

        (PUT "/" {:keys [jwt-claims body]}
          (visualisation/upsert tenant-conn (assoc body "id" id) jwt-claims))

        (DELETE "/" _
          (visualisation/delete tenant-conn id))))))

(defmethod ig/init-key :akvo.lumen.endpoint.visualisation/visualisation  [_ opts]
  (endpoint opts))

(s/def ::windshaft-url string?)

(defmethod integrant-key :akvo.lumen.endpoint.visualisation/visualisation [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager
                                  ::windshaft-url] )))
