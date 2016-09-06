(ns org.akvo.lumen.endpoint.flow
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.lib.flow :as flow]
            [ring.util.response :refer [response]]))

(defn endpoint [{{:keys [flow-report-database-url]} :config}]
  (context "/api/flow" _
    (GET "/folders-and-surveys/:org-id" request
      (let [items (flow/folders-and-surveys (:jwt-claims request)
                                            flow-report-database-url
                                            (-> request :params :org-id))]
        (if items
          (response items)
          (response ()))))

    (GET "/instances" request
      (response (flow/instances (:jwt-claims request))))))
