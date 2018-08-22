(ns akvo.lumen.component.caddisfly-test
  (:require [akvo.lumen.component.caddisfly :as c]
            [clojure.test :refer :all]
            [com.stuartsierra.component :as component]))

(deftest component-versions-test
  (testing "prod component version"
    (let [caddisfly-prod (-> {:schema-uri "https://akvoflow-public.s3.amazonaws.com/caddisfly-tests.json"}
                             c/caddisfly
                             component/start)]
      (is (= (-> caddisfly-prod :schema first val keys)
             '(:name :uuid :brand :hasImage :results)))))
  (testing "dev component version"
    (let [caddisfly-dev (-> {:local-schema-uri "./caddisfly/tests-schema.json"}
                            c/dev-caddisfly
                            component/start)]
      (is (= (-> caddisfly-dev :schema first val keys)
             '(:name :uuid :brand :hasImage :results))))))
