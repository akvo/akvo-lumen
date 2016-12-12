(ns akvo.lumen.endpoint.transformation-test
  (:require [clojure.test :refer :all]
            [akvo.lumen.endpoint.transformation :as transformation]))

(def handler
  (transformation/endpoint {}))
