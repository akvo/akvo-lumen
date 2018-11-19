(ns akvo.lumen.component.caddisfly-test
  (:require [akvo.lumen.component.caddisfly :as c]
            [integrant.core :as ig]
            [clojure.test :refer :all]))

(defn caddisfly
  ([]
   (caddisfly :dev))
  ([type]
   (if (= type :prod)
     (->> {:config {:caddisfly {:schema-uri "https://akvoflow-public.s3.amazonaws.com/caddisfly-tests.json"}}}
          (ig/init-key :akvo.lumen.component.caddisfly/prod))
     (->> {:config {:caddisfly {:local-schema-uri "./caddisfly/tests-schema.json"}}}
          (ig/init-key :akvo.lumen.component.caddisfly/local)))))

(deftest component-versions-test
  (testing "prod component version"
    (is (= (-> (caddisfly :prod) :schema first val keys)
           '(:name :uuid :brand :hasImage :results))))
  (testing "dev component version"
    (is (= (-> (caddisfly :dev) :schema first val keys)
           '(:name :uuid :brand :hasImage :results)))))
