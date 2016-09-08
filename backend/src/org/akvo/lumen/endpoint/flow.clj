(ns org.akvo.lumen.endpoint.flow
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.lib.flow :as flow]))


(defn endpoint [{{:keys [flow-report-database-url]} :config}]
  (context "/api/flow" _
    (GET "/folders-and-surveys/:org-id" request
      (flow/folders-and-surveys (:jwt-claims request)
                                flow-report-database-url
                                (-> request :params :org-id)))

    (GET "/instances" request
      (flow/instances (:jwt-claims request)))))
