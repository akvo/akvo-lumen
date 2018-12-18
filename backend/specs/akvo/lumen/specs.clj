(ns akvo.lumen.specs
  (:require [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.tools.logging :as log]))

(defn keyname [key] (str (namespace key) "/" (name key)))

(defn sample-with-gen [s map-gen amount]
  (map first (s/exercise s amount map-gen)))

(defn sample [s amount]
  (map first (s/exercise s amount)))
