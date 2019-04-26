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
     (->> {:schema-uri "https://akvoflow-public.s3.amazonaws.com/caddisfly-tests.json"}
          (ig/init-key :akvo.lumen.component.caddisfly/prod))
     (->> {:local-schema-uri "./caddisfly/tests-schema.json"}
          (ig/init-key :akvo.lumen.component.caddisfly/local)))))

(deftest component-versions-test
  (testing "prod component version"
    (is (= (-> (caddisfly :prod) :schema first val keys)
           '(:name :uuid :brand :hasImage :results))))
  (testing "dev component version"
    (is (= (-> (caddisfly :dev) :schema first val keys)
           '(:name :uuid :brand :hasImage :results)))))

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
          diff  (data/diff (adapt* d1) (adapt* d2))
          ]
      (is (= (mapv #(get d1 %) (map first (first ddd)))
             [{:name "Water - Colorimetry - Caddisfly - Fluoride (0 - 2 mg/l F)",
               :uuid "f0f3c1dd-89af-49f1-83e7-bcc31c3006cf",
               :brand "Caddisfly",
               :hasImage true,
               :results [{:id 1, :name "Fluoride", :unit "mg/l"}]}
              {:name
               "Water - Colorimetry - Caddisfly - Free Chlorine (0 - 3 mg/l Cl2)",
               :uuid "a2413119-38eb-4959-92ee-cc169fdbb0fc",
               :brand "Caddisfly",
               :hasImage true,
               :results [{:id 1, :name "Free Chlorine", :unit "mg/l"}]}
              {:name
               "Water - Colorimetry - Caddisfly - Free Chlorine (0 - 1 mg/l Cl2)",
               :uuid "c3535e72-ff77-4225-9f4a-41d3288780c6",
               :brand "Caddisfly",
               :hasImage true,
               :results [{:id 1, :name "Free Chlorine", :unit "mg/l"}]}
              {:name "Water - Colorimetry - Caddisfly - Chromium",
               :uuid "d488672f-9a4c-4aa4-82eb-8a95c40d0296",
               :brand "Caddisfly",
               :hasImage true,
               :results [{:id 1, :name "Chromium", :unit "mg/l"}]}]))
      )))
