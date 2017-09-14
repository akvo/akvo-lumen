(ns akvo.lumen.lib.aes
  (:import [javax.crypto Cipher]
           [javax.crypto.spec SecretKeySpec]
           [org.apache.commons.codec.binary Base64]
           [org.apache.commons.codec.digest DigestUtils]))

(defn encrypt
  "Accepts secret & clear text strings and returns a base64 encoded byte array."
  [^String secret ^String clear-text]
  {:pre [(string? secret) (string? clear-text)]
   :post [(string? %)(Base64/isBase64 (.getBytes %))]}
  (let [cipher (Cipher/getInstance "AES/ECB/PKCS5Padding")
        key-bytes (DigestUtils/sha256 secret)
        clear-text-bytes (.getBytes clear-text)
        key-spec (SecretKeySpec. key-bytes "AES")
        _ (.init cipher Cipher/ENCRYPT_MODE key-spec)
        output (.doFinal cipher clear-text-bytes)]
    (Base64/encodeBase64String output)))

(defn decrypt
  "Accepts string secret and a base64 encoded byte array and returns clear text."
  [^String secret ^String cipher-text]
  {:pre [(string? secret) (string? cipher-text)
         (Base64/isBase64 (.getBytes cipher-text))]
   :post [(string? %)]}
  (let [cipher (Cipher/getInstance "AES/ECB/PKCS5Padding")
        key-bytes (DigestUtils/sha256 secret)
        key-spec (SecretKeySpec. key-bytes "AES")
        _ (.init cipher Cipher/DECRYPT_MODE key-spec)
        cipher-bytes (Base64/decodeBase64 cipher-text)
        output (.doFinal cipher cipher-bytes)]
    (String. output)))
