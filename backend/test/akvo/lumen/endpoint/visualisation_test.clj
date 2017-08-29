(ns akvo.lumen.endpoint.visualisation-test
  (:require [akvo.lumen.endpoint.visualisation :as visualisation]))

(def handler
  (visualisation/endpoint {}))
