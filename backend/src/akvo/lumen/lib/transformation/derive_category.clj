(ns akvo.lumen.lib.transformation.derive-category
  (:require [akvo.lumen.util :as util]
            [akvo.lumen.lib.transformation.engine :as engine]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [clojure.set :as set]
            [clojure.set :refer (rename-keys) :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [hugsql.core :as hugsql]
            [clojure.spec.alpha :as s]
            [akvo.lumen.specs.transformation :as transformation.s]))

(defmethod engine/valid? "core/derive-category"
  [op-spec]
  (s/valid? (transformation.s/op-spec {:op "core/derive-category"}) (walk/keywordize-keys op-spec)))

(defmethod engine/apply-operation "core/derive-category"
  [{:keys [tenant-conn]} table-name columns op-spec]
  {:success? true
   :execution-log ["wow!"]
   :columns columns})
