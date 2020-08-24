(ns akvo.lumen.lib.aes-test
  (:require [akvo.lumen.lib.aes :as aes]
            [clojure.test :refer :all]))

(deftest ^:unit aes
  (let [secret "secret"
        clear-text "clear-text"]
    (testing "Encryption & decryption round trip"
      (is (= clear-text
             (aes/decrypt secret (aes/encrypt secret clear-text)))))
    (testing "Encryption input and output is different"
      (is (not (= clear-text
                  (aes/encrypt secret clear-text)))))
    (testing "Make sure encrypt throw if clear text is not text"
      (is (thrown? AssertionError (aes/encrypt secret nil)))
      (is (thrown? AssertionError (aes/encrypt secret [])))
      (is (thrown? AssertionError (aes/encrypt secret 0))))
    (testing "Make sure encrypt throw if secret is not text"
      (is (thrown? AssertionError (aes/encrypt nil clear-text)))
      (is (thrown? AssertionError (aes/encrypt [] clear-text)))
      (is (thrown? AssertionError (aes/encrypt 0 clear-text))))
    (testing "Make sure decrypt throw if clear text is not text"
      (is (thrown? AssertionError (aes/decrypt secret nil)))
      (is (thrown? AssertionError (aes/decrypt secret [])))
      (is (thrown? AssertionError (aes/decrypt secret 0))))
    (testing "Make sure decrypt throw if secret is not text"
      (is (thrown? AssertionError (aes/decrypt nil clear-text)))
      (is (thrown? AssertionError (aes/decrypt [] clear-text)))
      (is (thrown? AssertionError (aes/decrypt 0 clear-text))))))
