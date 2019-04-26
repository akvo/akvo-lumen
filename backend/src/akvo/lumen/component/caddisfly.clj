(ns akvo.lumen.component.caddisfly
  "akvo-caddisfly component support"
  (:require [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.java.io :as io]
            [clojure.spec.alpha :as s]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]))

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
  (let [tests (-> local-schema-uri io/resource slurp (json/parse-string keyword) extract-tests)]
    (log/warn ::start "Using caddisfly LOCAL schema-uri:" local-schema-uri)
    (map->Caddisfly (assoc opts :schema tests))))

(defmethod ig/init-key :akvo.lumen.component.caddisfly/prod  [_ {:keys [schema-uri] :as opts}]
  {:pre [schema-uri]}
  (let [tests (-> schema-uri client/get :body (json/decode keyword) extract-tests)]
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
