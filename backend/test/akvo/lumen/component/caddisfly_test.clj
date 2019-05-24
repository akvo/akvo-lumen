(ns akvo.lumen.component.caddisfly-test
  (:require [akvo.lumen.component.caddisfly :as c]
            [akvo.lumen.specs.caddisfly :as caddisfly.s]
            [cheshire.core :as json]
            [clojure.data :as data]
            [clojure.java.io :as io]
            [clojure.set :as set]
            [clojure.test :refer :all]
            [integrant.core :as ig]))

(defn caddisfly
  ([]
   (caddisfly :dev))
  ([type]
   (if (= type :prod)
     (->> {:schema-uri "https://s3-eu-west-1.amazonaws.com/akvoflow-public/caddisfly-tests-v2.json"}
          (ig/init-key :akvo.lumen.component.caddisfly/prod))
     (->> {:local-schema-uri "./caddisfly/caddisfly-tests-v2.json"}
          (ig/init-key :akvo.lumen.component.caddisfly/local)))))

(deftest component-versions-test
  (testing "prod component version"
    (is (= (-> (caddisfly :prod) :schema first val keys)
           '(:name :uuid :sample :device :brand :model :reagents :results :hasImage))))
  (testing "dev component version"
    (is (= (-> (caddisfly :dev) :schema first val keys)
           '(:name :uuid :sample :device :brand :model :reagents :results :hasImage)))))

(defn load-local-file [uri]
  (-> uri io/resource slurp (json/parse-string keyword)))

(deftest upgrading-caddisfly-schema
  (testing "compatibility"
    (let [v1 "./caddisfly/tests-schema.json"
          d1 (c/extract-tests (load-local-file v1))
          v2 "./caddisfly/caddisfly-tests-v2.json"
          d2 (c/extract-tests-v2 (load-local-file v2))
          adapt* (fn [d] (reduce
                          (fn [c [uuid t]]
                            (assoc c uuid
                                   (-> t
                                       (update :hasImage boolean)
                                       (update :results (partial mapv #(select-keys % [:id])))
                                       (select-keys [:uuid :hasImage :results]))
                                   )) {}  d))
          diff  (data/diff (adapt* d1) (adapt* d2))]
      (is (= (mapv #(:uuid (get d1 %)) (map first (first diff)))
             c/missed-v1-uuids-in-v2))
      (testing "testing compatibility backwards"
        (let [d3 (c/version-schema-backwards-adapt d1 d2)
              diff2 (data/diff (adapt* d1) (adapt* d3))]
          (is (= c/v2-count (count (adapt* d3))))
          (is (nil? (first diff2))))))))
