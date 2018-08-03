(ns akvo.lumen.caddisfly-test
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         *error-tracker*
                                         error-tracker-fixture]]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.test-utils :refer [import-file]]
            [cheshire.core :as json]
            [akvo.lumen.caddisfly :as caddisfly]
            [clojure.java.io :as io]
            [clojure.test :refer :all]
            [clojure.tools.logging :as log]))


(def parse-json #(json/parse-string (slurp (io/resource %)) keyword))

(def schemas (->> (:tests (parse-json "./caddisfly/tests-schema.json"))
                  (reduce #(assoc % (:uuid %2) %2) {})))

(defn parse-test [url]
  (dissoc (parse-json url) :app :device :testDate :user))

#_{:image "b1961e99-bc1c-477c-9309-ae5e8d2374e8.png",
   :name "Water - Fluoride",
   :result [{:id 1, :name "Fluoride", :unit "ppm", :value "1.51"}],
   :type "caddisfly",
   :uuid "f0f3c1dd-89af-49f1-83e7-bcc31c3006cf"}


(deftest dictionary-relation
  (testing "looking up caddisfly uuid in tests-schema"
    (testing "fluoride"
      (let [fluoride-test (parse-test "./caddisfly/tests/fluoride.json")
            fluoride-schema (schemas (:uuid fluoride-test))]
        (is (= fluoride-schema {:name "Water - Colorimetry - Caddisfly - Fluoride (0 - 2 mg/l F)",
	                        :uuid "f0f3c1dd-89af-49f1-83e7-bcc31c3006cf",
	                        :brand "Caddisfly",
	                        :hasImage true,
	                        :results [{:id 1, :name "Fluoride", :unit "mg/l"}]}))))
    (testing "electrical conductivity"
      (let [ec-test (parse-test "./caddisfly/tests/electrical-conductivity.json")
            ec-schema (schemas (:uuid ec-test))]
        (is (= ec-schema {:name
	                  "Water - Sensors - Caddisfly - Electrical Conductivity, (0 - 12500)",
	                  :uuid "f88237b7-be3d-4fac-bbee-ab328eefcd14",
	                  :brand "Caddisfly",
	                  :hasImage false,
	                  :results
	                  [{:id 1, :name "Water Electrical Conductivity", :unit "μS/cm"}
	                   {:id 2, :name "Temperature", :unit "°Celsius"}]}))))))

(caddisfly/child-questions {:title "Fluoride", :type :text, :id :c110249115 } "f0f3c1dd-89af-49f1-83e7-bcc31c3006cf")
