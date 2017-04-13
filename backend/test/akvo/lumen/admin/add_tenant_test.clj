(ns akvo.lumen.admin.add-tenant-test
  (:require [akvo.lumen.admin.add-tenant :as at]
            [clojure.test :refer [deftest testing is]]))


(deftest normalize-url
  (let [valid-url "https://tenant.akvo-lumen.org"]

    (testing "Valid url"
      (is (= (at/normalize-url valid-url)
             valid-url)))

    (testing "http"
      (is (= (at/normalize-url "http://tenant.akvo-lumen.org")
             valid-url)))

    (testing "Trailing slash"
      (is (= (at/normalize-url "https://tenant.akvo-lumen.org/")
             valid-url)))

    (testing "Http & trailing slash"
       (is (= (at/normalize-url "http://tenant.akvo-lumen.org/")
              valid-url)))))


(deftest conform-label
  (testing "Label from blacklist"
    (is (thrown? clojure.lang.ExceptionInfo
                 (at/conform-label (rand-nth at/blacklist)))))

  (testing "Too short"
    (is (thrown? clojure.lang.ExceptionInfo
                 (at/conform-label "a"))))

  (testing "Valid"
    (let [valid-label "tenant"]
      (is (= valid-label (at/conform-label valid-label))))))


(deftest label
  (testing "Production scheme"
    (is (= "tenant"
           (at/label "https://tenant.akvo-lumen.org"))))

  (testing "Production scheme with oddities"
    (is (= "tenant"
           (at/label "http://tenant.akvo-lumen.org/"))))

  (testing "Test scheme"
    (is (= "tenant"
           (at/label "https://tenant.akvotest.org"))))

  (testing "Local dev scheme"
    (is (= "tenant"
           (at/label "http://tenant3.lumen.localhost")))))
