(ns org.akvo.dash.endpoint.transformation-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.transformation :as transformation]))

(def handler
  (transformation/endpoint {}))
