(ns akvo.lumen.utils.dev-emailer
  (:require [akvo.lumen.protocols :as p]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]))


(defrecord DevEmailer [store]
  p/SendEmail
  (send-email [this recipients email]
    (swap! store #(conj % {:email email
                           :recipients recipients}))
    (log/warn recipients)
    (log/warn email)))

(defmethod ig/init-key :akvo.lumen.utils.dev-emailer/emailer  [_ {:keys [from-email from-name] :as opts} ]
  (log/info  "Using std out emailer" opts)
  (map->DevEmailer (assoc opts :store (atom []))))

(defmethod ig/pre-init-spec :akvo.lumen.utils.dev-emailer/emailer [_]
  (s/keys :req-un [::from-email ::from-name]))
