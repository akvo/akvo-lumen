(ns akvo.lumen.specs.transformation.engine
  (:require [akvo.lumen.lib.transformation.engine :as lib.transformation.engine]
            [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs.transformation :as transformation.s]
            [akvo.lumen.util :as u]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]))


(s/fdef lib.transformation.engine/new-dataset-version
  :args (s/cat :conn ::db.s/tenant-connection
               :dsv ::transformation.s/next-dataset-version))
