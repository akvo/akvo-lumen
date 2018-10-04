(ns duct.util.system
  (:require [clojure.walk :as walk]
            [meta-merge.core :refer [meta-merge]]))

(defn read-config [source bindings]
  (->> source
       (walk/postwalk #(bindings % %))))

(defn load-system
  ([sources]
   (load-system sources {}))
  ([sources bindings]
   (->> sources
        (map #(read-config % bindings))
        (apply meta-merge))))
