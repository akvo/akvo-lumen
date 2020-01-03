(ns akvo.lumen.specs.raster
  (:require [clojure.tools.logging :as log]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs :as lumen.s]
            [clojure.spec.alpha :as s]))

(def ^:dynamic *id?*  lumen.s/str-uuid?)

(s/def ::id? #'*id?*)

(s/def ::id  (s/with-gen
               ::id?
               lumen.s/str-uuid-gen))
