(ns akvo.lumen.variant)

(defn variant? [v]
  (and (vector? v)
       (= (count v) 2)
       (let [t (first v)]
         (and (keyword? t)
              (boolean (namespace t))))))

(defn tag [v]
  {:pre [(variant? v)]}
  (first v))

(defn value [v]
  {:pre [(variant? v)]}
  (second v))
