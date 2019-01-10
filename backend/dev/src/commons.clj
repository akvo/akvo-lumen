(ns commons
  (:require [clojure.edn :as edn]
            [clojure.java.io :as io]))

(def tenants (->> "seed.edn" io/resource slurp edn/read-string
                        :tenant-manager :tenants))
