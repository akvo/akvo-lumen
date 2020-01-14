(ns akvo.lumen.main
  (:gen-class)
  (:require [akvo.lumen.config :as config]
            [akvo.lumen.endpoint.commons]
            [akvo.lumen.migrate :as migrate]
            [clojure.java.io :as io]
            [clojure.spec.test.alpha :as stest]
            [duct.core :as duct]
            [duct.core.env :as env]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]))

(def config-file "akvo/lumen/config.edn")

;; While Duct core.env does not have support for doubles
;; https://github.com/duct-framework/core/pull/28
(defmethod env/coerce 'Double [x _]
  (Double/parseDouble x))

(defn -main [& args]
  (config/assert-bindings)

  (do
    (derive :akvo.lumen.component.emailer/mailjet-v3-emailer
            :akvo.lumen.component.emailer/emailer)

    (derive :akvo.lumen.component.caddisfly/prod
            :akvo.lumen.component.caddisfly/caddisfly)

    (derive :akvo.lumen.component.error-tracker/prod
            :akvo.lumen.component.error-tracker/error-tracker)

    (let [config (config/construct config-file)
          _   (migrate/migrate config)
          _ (ig/load-namespaces config)
          system (try (ig/init config)
                      (catch Exception e
                        (log/error e)))]
      (when (:conform-specs (:akvo.lumen.specs/specs system))
        (stest/instrument))
      system)))
