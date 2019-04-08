(ns akvo.lumen.specs.protocols
  (:require [clojure.tools.logging :as log]
            [akvo.lumen.protocols :as p]
            [clojure.spec.alpha :as s]))

(s/def ::db-query-service (partial satisfies? p/DBQueryService))
