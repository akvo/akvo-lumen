(ns akvo.lumen.specs.visualisation.legend
  (:require [akvo.lumen.specs :as lumen.s]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]))

(create-ns  'akvo.lumen.specs.visualisation.legend.order)
(alias 'order.s 'akvo.lumen.specs.visualisation.legend.order)

(s/def ::order.s/mode #{"auto" "custom"})

(s/def ::order.s/value string?)

(s/def ::order.s/list (s/coll-of ::order.s/value :distinct true))


(s/def ::title (s/nilable string?))

(s/def ::visible boolean?)

(s/def ::position #{"right" "top" "left" "bottom"})

(s/def ::order (s/keys :req-un [::order.s/mode ::order.s/list]))

(s/def ::legend (s/keys :req-un [::order]))
