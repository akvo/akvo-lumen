(ns akvo.lumen.specs.config
      (:require [clojure.spec.alpha :as s]
		[akvo.lumen.specs.core :as lumen.s]
                [akvo.lumen.specs.db :as db.s]))
   (s/def ::db-uri ::db.s/uri)

   (s/def ::db (s/keys :req-un [::db-uri]))

   (s/def ::config
     (s/keys :req-un [::db]))
