(ns akvo.lumen.component.caddisfly-test
  (:require [akvo.lumen.component.caddisfly :as c]
            [clojure.test :refer :all]
            [com.stuartsierra.component :as component]))

(defn caddisfly
  ([]
   (caddisfly :dev))
  ([type]
   (if (= type :prod)
     (-> {:schema-uri "https://akvoflow-public.s3.amazonaws.com/caddisfly-tests.json"}
         c/caddisfly
         component/start)
     (-> {:local-schema-uri "./caddisfly/tests-schema.json"}
         c/dev-caddisfly
         component/start))))



(deftest component-versions-test
  (testing "prod component version"
    (is (= (-> (caddisfly :prod) :schema first val keys)
           '(:name :uuid :brand :hasImage :results))))
  (testing "dev component version"
    (is (= (-> (caddisfly :dev) :schema first val keys)
           '(:name :uuid :brand :hasImage :results)))))
