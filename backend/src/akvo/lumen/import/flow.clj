(ns akvo.lumen.import.flow
  (:require [akvo.commons.psql-util :as pg]
            [akvo.lumen.import.common :as import]
            [akvo.lumen.import.flow-common :as flow-common]
            [akvo.lumen.import.flow-v2 :as v2]
            [akvo.lumen.import.flow-v3 :as v3]))


(defmethod import/dataset-importer "AKVO_FLOW"
  [{:strs [instance surveyId formId refreshToken version] :as spec}
   {:keys [flow-api-url keycloak-realm keycloak-url] :as config}]
  (let [version (if version version 1)
        token-endpoint (format "%s/realms/%s/protocol/openid-connect/token"
                               keycloak-url
                               keycloak-realm)
        headers-fn #(flow-common/flow-api-headers token-endpoint refreshToken)
        survey (delay (flow-common/survey-definition flow-api-url
                                                     headers-fn
                                                     instance
                                                     surveyId))]
    (reify
      java.io.Closeable
      (close [this])
      import/DatasetImporter
      (columns [this]
        (cond
          (<= version 2) (v2/dataset-columns (flow-common/form @survey formId) version)
          (<= version 3) (v3/dataset-columns (flow-common/form @survey formId) version)))
      (records [this]
        (cond
          (<= version 2) (v2/form-data headers-fn @survey formId)
          (<= version 3) (v3/form-data headers-fn @survey formId))))))
