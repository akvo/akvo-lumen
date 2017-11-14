(ns akvo.lumen.import.raster-test
  (:require [clojure.test :refer :all]
            [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture]]
            [akvo.lumen.import.raster :refer :all]
            [clojure.java.io :as io]))

(use-fixtures :once tenant-conn-fixture)

(deftest ^:functional import-raster
  (testing "Import raster"
    (let [filename "SLV_ppp_v2b_2015_UNadj.tif"
          path (.getAbsolutePath (.getParentFile (io/file (io/resource filename))))
          projection (project-to-web-mercator path filename)]
      (is (zero? (-> projection :shell :exit)))
      (let [sql (get-raster-sql (:path projection) (:file projection))]
        (is (zero? (-> sql :shell :exit)))))))
