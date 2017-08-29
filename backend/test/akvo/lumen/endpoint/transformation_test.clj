(ns akvo.lumen.endpoint.transformation-test
  (:require [akvo.lumen.endpoint.transformation :as transformation]))

(def handler
  (transformation/endpoint {}))
