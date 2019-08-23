(ns akvo.lumen.lib.import.flow
  (:require [akvo.commons.psql-util :as pg]
            [akvo.lumen.lib.import.common :as import]
            [akvo.lumen.component.flow :as c.flow]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.flow-common :as flow-common]
            [akvo.lumen.lib.import.flow-v2 :as v2]
            [akvo.lumen.lib.import.flow-v3 :as v3]
            [clojure.tools.logging :as log]))

(defn- read-flow-urls [flow-api]
  {:internal (:internal-url flow-api)
   :keycloak (:url flow-api)
   :auth0 (:auth0-url flow-api)})

(defmethod import/dataset-importer "AKVO_FLOW"
  [{:strs [instance surveyId formId token email version] :as spec}
   {:keys [flow-api] :as config}]
  (let [version (if version version 1)
        headers-fn #((:internal-api-headers flow-api) {:email email :token token})
        survey (delay (flow-common/survey-definition (:internal-url flow-api)
                                                     headers-fn
                                                     instance
                                                     surveyId))]
    (reify
      java.io.Closeable
      (close [this])
      p/DatasetImporter
      (columns [this]
        (try
          (cond
            (<= version 2) (v2/dataset-columns (flow-common/form @survey formId))
            (<= version 3) (v3/dataset-columns (flow-common/form @survey formId)))
          (catch Throwable e
            (if-let [ex-d (ex-data e)]
              (do
                (log/error e)
                (throw (ex-info (or (:cause e) (str "Null cause from instance: " instance))
                                (assoc ex-d
                                       :instance instance
                                       :flow-urls (read-flow-urls flow-api)))))
              (throw e)))))
      (records [this]
        (try
          (cond
            (<= version 2) (v2/form-data headers-fn @survey formId)
            (<= version 3) (v3/form-data headers-fn instance @survey formId))
          (catch Throwable e
            (if-let [ex-d (ex-data e)]
              (throw (ex-info (or (:cause e) (str "Null cause from instance: " instance))
                              (assoc ex-d
                                     :instance instance
                                     :flow-urls (read-flow-urls flow-api))))
              (throw e))))))))
