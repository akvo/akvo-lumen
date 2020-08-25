(ns akvo.lumen.admin.add-tenant-test
  (:require [akvo.lumen.admin.add-tenant :as at]
            [clojure.test :refer [deftest is testing]]))


(deftest ^:unit conform-label

  (testing "Valid"
    (let [valid-label "tenant"]
      (is (= valid-label (at/conform-label valid-label)))))

  (testing "Label from blacklist"
    (is (thrown? clojure.lang.ExceptionInfo
                 (at/conform-label (rand-nth (seq at/blacklist))))))

  (testing "Too short"
    (is (thrown? clojure.lang.ExceptionInfo
                 (at/conform-label "a"))))

  (testing "Too long"
    (is (thrown? clojure.lang.ExceptionInfo
                 (at/conform-label (->> (concat (range 97 123) (range 97 123))
                                        (map char)
                                        (take 40)
                                        (apply str))))))

  ;; Update
  (testing "Alphanumeric"
    (is (thrown? clojure.lang.ExceptionInfo
                 (at/conform-label "abc;``"))))

  (testing "Whitespace"
    (is (thrown? clojure.lang.ExceptionInfo
                 (at/conform-label "a b"))))

  (testing "Lowercase"
    (is (thrown? clojure.lang.ExceptionInfo
                 (at/conform-label "ABC"))))

  (testing "Start with a letter or number"
    (is (thrown? clojure.lang.ExceptionInfo
                 (at/conform-label "-ao")))))


(deftest ^:unit label
  (testing "Production scheme"
    (is (= "tenant"
           (at/label "https://tenant.akvo-lumen.org"))))

  (testing "Production scheme with oddities"
    (is (= "tenant"
           (at/label "https://tenant.akvo-lumen.org/"))))

  (testing "Test scheme"
    (is (= "tenant"
           (at/label "https://tenant.akvotest.org")))))
