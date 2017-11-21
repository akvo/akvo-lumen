(ns akvo.lumen.import.raster-test
  (:require [clojure.test :refer :all]
            [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture]]
            [akvo.lumen.import.raster :refer :all]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]))

(use-fixtures :once tenant-conn-fixture)

(deftest ^:functional import-raster
  (testing "Import raster"
    (let [filename "SLV_ppp_v2b_2015_UNadj.tif"
          path (.getAbsolutePath (.getParentFile (io/file (io/resource filename))))
          file-info (get-file-info path filename)
          prj (project-to-web-mercator path filename)]
      (is (zero? (get-in prj [:shell :exit])))
      (is (false? (web-mercator? (get-in file-info [:shell :out]))))
      (let [prj-info (get-file-info (:path prj) (:filename prj))]
        (is (zero? (get-in prj-info [:shell :exit])))
        (is (web-mercator? (-> prj-info :shell :out))))
      (let [table-name (str "t_" (System/currentTimeMillis))
            sql (get-raster-data-as-sql (:path prj) (:filename prj) table-name)
            file (str "/tmp/" (System/currentTimeMillis) ".sql")]
        (create-raster-table *tenant-conn* {:table-name table-name})
        (create-raster-index *tenant-conn* {:table-name table-name})
        (add-raster-constraints *tenant-conn* {:table-name table-name})
        (jdbc/execute! *tenant-conn* [sql])
        (is (= 84 (:c (raster-count *tenant-conn* {:table-name table-name}))))))))
