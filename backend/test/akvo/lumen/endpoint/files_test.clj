(ns akvo.lumen.endpoint.files-test
  (:require [clojure.test :refer :all]
            [akvo.lumen.endpoint.files :as files]))

(def handler
  (files/endpoint {}))
