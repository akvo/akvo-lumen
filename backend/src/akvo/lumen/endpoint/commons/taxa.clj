(ns akvo.lumen.endpoint.commons.taxa
  "An experiment of taxonomic variants with the goal to express business logic
  via variants and hierarchies.

  A taxon is a variant with a classified key

  taxon taxa")

(defn taxon? [t]
  (and
   (map? t)
   (= 1 (count t))
   (let [tag (-> t keys first)]
     (and (keyword? tag)
          (boolean (namespace tag))))))

(defn tag [t]
  #_{:pre [(taxon? t)]}
  (-> t keys first))

(defn value [t]
  #_{:pre [(taxon? t)]}
  (-> t vals first))

(defn ok? [t]
  (isa? (tag t) ::ok))

(comment
  (taxon? {::a {}}) ;; true
  (tag {::a {:k "V"}}) ;; :akvo.lumen.endpoint.commons.taxa/a
  (value {::a {:k "V"}}) ;; {:k "V"}
  (ok? {::ok {}}) ;; true
  )

(derive ::okish ::ok)

(defn f1 [t]
  (let [v (value t)]
    {::okish (assoc v :f1 "f1")}))

(defn f2
  ([t]
   (f2 t "f2"))
  ([t a]
   (let [v (value t)]
     {::ok (assoc v :f2 a)}))
  ([t a b]
   (let [v (value t)]
     {::ok (-> v
               (assoc :f2a a)
               (assoc :f2b b))})))

(defn f3 [t]
  {::err (-> {}
             (assoc :stack (value t))
             (assoc :f3 "f3"))})


(defn cond-thread
  [expr clauses]
  (reduce (fn [previous {:keys [f args]}]
            (if (ok? previous)
              (if args
                (apply f previous args)
                (f previous))
              previous))
          {::ok expr}
          clauses))

(defmacro ?>
  "Takes a value and thread trough forms. Short circut if taxon returned from
  forms is not a child of ::ok"
  [expr & forms]
  (loop [clauses []
         forms forms]
    (if forms
      (let [form (first forms)
            clause (if (seq? form)
                     (hash-map :f (resolve (first form))
                               :args (next form))
                     (hash-map :f (resolve form)))]
        (recur (conj clauses clause) (next forms)))
      (cond-thread expr clauses))))

(comment
  (?> nil) ;; #:akvo.lumen.endpoint.commons.taxa{:ok nil}
  (?> {:k :v}) ;; #:akvo.lumen.endpoint.commons.taxa{:ok {:k :v}}
  (?> {:k :v} f1);; #:akvo.lumen.endpoint.commons.taxa{:ok {:k :v}, :okish {:f1 "f1"}}

  (?> {:k :v}
      f1
      (f2 "F2" "F22")) ;; #:akvo.lumen.endpoint.commons.taxa{:ok {:k :v, :f1 "f1", :f2a "F2", :f2b "F22"}}

  (?> {:k :v}
      f1
      f3
      (f2 "F2" "F22")) ;; #:akvo.lumen.endpoint.commons.taxa{:err {:stack {:k :v, :f1 "f1"}, :f3 "f3"}}

  )
