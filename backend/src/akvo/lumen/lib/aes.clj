(ns akvo.lumen.lib.aes
  (:import [java.security SecureRandom]
           [javax.crypto Cipher]
           [javax.crypto.spec SecretKeySpec IvParameterSpec]
           [org.apache.commons.codec.binary Base64]
           [org.apache.commons.codec.digest DigestUtils]))

(defonce ^:private secure-random (SecureRandom.))

(defn random-iv
  "Generate a base64 encoded random byte array of size 16"
  []
  (let [iv-bytes (byte-array 16)]
    (.nextBytes secure-random iv-bytes)
    (Base64/encodeBase64String iv-bytes)))

(def zero-iv
  "A base64 encoded all-zero byte array of size 16"
  (Base64/encodeBase64String (byte-array 16 (byte 0x00))))

(defn base64?
  "Returns true if s is a base64 encoded string"
  [s]
  (and (string? s)
       (Base64/isBase64 (.getBytes ^String s))))

(defn encrypt
  "Accepts a string secret, an optional base64 encoded initialization vector (iv)
  and the clear text and returns a base64 encoded byte array."
  ([secret clear-text]
   (encrypt secret zero-iv clear-text))
  ([^String secret ^String iv ^String clear-text]
   {:pre [(string? secret) (base64? iv) (string? clear-text)]
    :post [(base64? %)]}
   (let [cipher (Cipher/getInstance "AES/CBC/PKCS5Padding")
         key-bytes (DigestUtils/sha256 secret)
         clear-text-bytes (.getBytes clear-text)
         key-spec (SecretKeySpec. key-bytes "AES")
         iv-parameter-spec (IvParameterSpec. (Base64/decodeBase64 iv))
         _ (.init cipher Cipher/ENCRYPT_MODE key-spec iv-parameter-spec)
         output (.doFinal cipher clear-text-bytes)]
     (Base64/encodeBase64String output))))

(defn decrypt
  "Accepts a string secret, an optional base64 encoded initialization vector (iv)
  and a base64 encoded byte array and returns clear text."
  ([secret cipher-text]
   (decrypt secret zero-iv cipher-text))
  ([^String secret  ^String iv ^String cipher-text]
   {:pre [(string? secret) (base64? iv) (base64? cipher-text)]
    :post [(string? %)]}
   (let [cipher (Cipher/getInstance "AES/CBC/PKCS5Padding")
         key-bytes (DigestUtils/sha256 secret)
         key-spec (SecretKeySpec. key-bytes "AES")
         iv-parameter-spec (IvParameterSpec. (Base64/decodeBase64 iv))
         _ (.init cipher Cipher/DECRYPT_MODE key-spec iv-parameter-spec)
         cipher-bytes (Base64/decodeBase64 cipher-text)
         output (.doFinal cipher cipher-bytes)]
     (String. output))))
