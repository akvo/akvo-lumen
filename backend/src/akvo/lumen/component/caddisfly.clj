(ns akvo.lumen.component.caddisfly
  "akvo-caddisfly component support"
  (:require [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.java.io :as io]
            [clojure.spec.alpha :as s]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]))

(def v2-count 109)

(def missed-v1-uuids-in-v2
  ["f0f3c1dd-89af-49f1-83e7-bcc31c3006cf"
   "a2413119-38eb-4959-92ee-cc169fdbb0fc"
   "c3535e72-ff77-4225-9f4a-41d3288780c6"
   "d488672f-9a4c-4aa4-82eb-8a95c40d0296"])

(defn version-schema-backwards-adapt
  "Even when we think we can safely ignore them. As they were obsolete before Lumen was released.
   Anyway, we'll join the missed-v1-tests to avoid data inconsistency"
  [d1 d2]
  (reduce (fn [c t]
            (assoc c t (get d1 t)))
          d2 missed-v1-uuids-in-v2))

(defrecord Caddisfly [local-schema-uri schema-uri schema])

(defmethod clojure.core/print-method Caddisfly
  [cad ^java.io.Writer writer]
  (.write writer (str "#<Caddisfly> schema: " (or (:local-schema-uri cad) (:schema-uri cad)))))

(defn extract-tests [json-schema]
  (->> (:tests json-schema)
       (reduce #(assoc % (:uuid %2) %2) {})))

(defn extract-tests-v2 [json-schema]
  (reduce (fn [c t] (assoc c (:uuid t) (update t :hasImage boolean))) {} (:tests json-schema)))

(defmethod ig/init-key :akvo.lumen.component.caddisfly/local  [_ {:keys [local-schema-uri] :as opts}]
  {:pre [local-schema-uri]}
  (let [v0-tests (-> "./caddisfly/tests-schema.json" io/resource slurp (json/parse-string keyword) extract-tests)
        tests (version-schema-backwards-adapt
               v0-tests
               (-> local-schema-uri io/resource slurp (json/parse-string keyword) extract-tests-v2))]
    (assert (= v2-count (count tests)))
    (log/warn ::start "Using caddisfly LOCAL schema-uri:" local-schema-uri)
    (map->Caddisfly (assoc opts :schema tests))))

(defmethod ig/init-key :akvo.lumen.component.caddisfly/prod  [_ {:keys [schema-uri] :as opts}]
  {:pre [schema-uri]}
  
  (let [v0-tests (-> "https://akvoflow-public.s3.amazonaws.com/caddisfly-tests.json" client/get :body (json/decode keyword) extract-tests)
        tests (version-schema-backwards-adapt
               v0-tests
               (-> schema-uri client/get :body (json/decode keyword) extract-tests-v2))]
    (assert (= v2-count (count tests)))
    (log/info ::start "Using caddisfly ONLINE schema-uri" schema-uri)
    (map->Caddisfly (assoc opts :schema tests))))

(defn get-schema
  [caddisfly caddisflyResourceUuid]
  (get (:schema caddisfly) caddisflyResourceUuid))


(s/def ::local-schema-uri string?)

(s/def ::caddisfly (partial instance? Caddisfly))

(defmethod ig/pre-init-spec :akvo.lumen.component.caddisfly/local [_]
  (s/keys :req-un [::local-schema-uri]))

(defmethod ig/pre-init-spec :akvo.lumen.component.caddisfly/prod [_]
  (s/keys :req-un [::schema-uri]))
