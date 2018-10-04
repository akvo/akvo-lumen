(ns duct.util.system
  (:require [clojure.java.io :as io]
            [clojure.walk :as walk]
            [clojure.tools.logging :as log]
            [com.stuartsierra.component :as component]
            [duct.component.endpoint :refer [endpoint-component]]
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
