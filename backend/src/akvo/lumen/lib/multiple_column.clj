(ns akvo.lumen.lib.multiple-column
  (:require [clojure.tools.logging :as log]
            [ring.util.response :refer [response]]))


(defn all [subtype subtype-id]
  (log/error ::all :subtype subtype :subtype-id subtype-id)
  (response {:subtype subtype :subtype-id subtype-id}))
