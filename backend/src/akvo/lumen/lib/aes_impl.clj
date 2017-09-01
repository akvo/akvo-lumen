(ns akvo.lumen.lib.aes-impl
  "Convenience functions around javax crypto AES implementation."
  (:require [clojure.test :refer :all])
  (:import javax.crypto.Cipher
           javax.crypto.spec.SecretKeySpec
           sun.misc.BASE64Decoder
           sun.misc.BASE64Encoder))

(def algo "AES")

#_(def algo "AES/ECB/NoPadding")


(defn rand-bytes [size]
  (let [rand (new java.security.SecureRandom)
        buffer (make-array Byte/TYPE size)]
    (.nextBytes rand buffer)
    buffer))

(def valid-byte-lengths
  (map #(/ % 8)
       [128 ;; bit key, 16 bytes, 10 cycles
        192 ;; bit key, 24 bytes, 12 cycles
        256 ;; bit key, 32 bytes, 14 cycles
        ]))

(defn valid-key-byte-length?
  [bytes]
  (contains? (set valid-byte-lengths )
             (count bytes)))

(defn string->key [algo secret]
  (when (not (valid-key-byte-length? secret))
    (throw (Exception. "Not valid length on key")))
  (new SecretKeySpec
       (bytes (byte-array (map byte secret)))
       algo))

(defn byte-array->key [algo bytes]
  (when (not (valid-key-byte-length? bytes))
    (throw (Exception. "Not valid length on key")))
  (new SecretKeySpec
       bytes
       algo))

(defn encrypt [key data]
  (let [cipher (Cipher/getInstance algo)
        a (.init cipher (Cipher/ENCRYPT_MODE) key)
        b (.doFinal cipher (.getBytes data))]
    (.encode (new BASE64Encoder) b)))

(defn decrypt [key encrypted-data]
  (let [cipher (Cipher/getInstance algo)
        a (.init cipher (Cipher/DECRYPT_MODE) key)
        decoded-value (.decodeBuffer (new BASE64Decoder) encrypted-data)
        decValue (.doFinal cipher decoded-value)]
    (new String decValue)))


(deftest encryption
  (let [data "super secret"
        ;; shared-secret "a password" ;; Not valid length

        ;; A string as shared secret
        shared-secret "a-shared-secret!"
        key (string->key algo shared-secret)

        ;; A byte array as shared secret
        ;; key (byte-array->key algo (rand-bytes 32))
        ]
    (prn (encrypt key data))

    (testing "Half way"
      (is (not (= data
                  (encrypt key data)))))
    (testing "Round trip "
      (is (= data
             (decrypt key (encrypt key data)))))

    (testing "Too short key"
      (is (thrown? Exception (string->key algo ""))))

    (testing "Too short key"
      (is (thrown? Exception (string->key algo "data"))))

    (testing "Too short key"
      (is (thrown? Exception (string->key algo nil))))

    (testing "Valid key lenghts does Not throw"
      (is (= (string->key algo "aaaaaaaaaaaaaaaa")
             (string->key algo "aaaaaaaaaaaaaaaa"))))))
