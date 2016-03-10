(ns org.akvo.dash.endpoint.files-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.files :as files]))

(def handler
  (files/endpoint {}))
