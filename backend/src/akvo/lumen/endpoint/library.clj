(ns akvo.lumen.endpoint.library
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib
             [dashboard :as dashboard]
             [visualisation :as visualisation]
             [collection :as collection]
             [raster :as raster]]
            [akvo.lumen.endpoint.commons.variant :as variant]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Experimental
;;;

(defn forms-per-instance [datasets]
  (reduce (fn [m {{:strs [formId instance surveryId]} :source}]
            (update m instance #(conj % formId)))
          {}
          datasets))

(defn allowed-forms
  "By the help of the forms-per-instance map get a allowed forms"
  [forms-per-instance]
  (let [fake-allowed-forms (set forms-per-instance)]
    fake-allowed-forms))

(defn filter-library
  [allowed-forms library]
  library)

(defn apply-flow-permissons
  "Depending on if the Flow API is benefited by getting a list of Forms or
  rather just list everything for a user:
  1. Build map of instance:
  {:instance-a [form-a form-b]
   :instance-b [form-c form-d]}
  2. Call each instance and maybe post forms to a filter or get a list of forms
  per user back and filter flow forms locally.
  3. Use the filtered flow form list and list library
  4. Return to user
  "
  [refresh-token {:keys [datasets] :as library}]
  (-> (forms-per-instance datasets)
      (allowed-forms)
      (filter-library library)))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Endpoint
;;;

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/library" {:keys [tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]
      (GET "/" {{refresh-token "refreshToken"} :body}
        (lib/ok
         (apply-flow-permissons refresh-token
                                {:dashboards (variant/value (dashboard/all tenant-conn))
                                 :datasets (variant/value (dataset/all tenant-conn) )
                                 :rasters (variant/value (raster/all tenant-conn))
                                 :visualisations (variant/value (visualisation/all tenant-conn))
                                 :collections (variant/value (collection/all tenant-conn))}))))))

(defmethod ig/init-key :akvo.lumen.endpoint.library/library  [_ opts]
  (endpoint opts))
