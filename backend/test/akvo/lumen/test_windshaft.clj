(ns akvo.lumen.test-windshaft
  (:require [clj-http.client :as http]
            clj-http.conn-mgr
            clojure.stacktrace
            [cheshire.core :as json]
            clojure.data))

(defonce pool-2 (clj-http.conn-mgr/make-reusable-conn-manager {:timeout 20 :threads 8 :default-per-route 8}))
(def base-url "http://windshaft:4000/lumen_tenant_1/layergroup")
(def base-url-2 "http://windshaft2:4000/lumen_tenant_1/layergroup")

(defn log-time [start tag]
  (println "[" tag "]" (- (System/currentTimeMillis) start)))

(defmacro tfuture [& body]
  `(future
     (try ~@body
          (catch Exception e# (println (.getMessage (clojure.stacktrace/root-cause e#)))))))

(defn tile [layer-group-id piece]
  (tfuture
    (let [start (System/currentTimeMillis)]
      (assert (= 200 (:status (http/get (str base-url "/" layer-group-id piece) {:as :json :connection-manager pool-2}))))
      (log-time start piece))))

(defn png [layer-group-id piece]
  (tfuture
    (let [start (System/currentTimeMillis)]
      (assert (= 200 (:status (http/get (str base-url "/" layer-group-id piece) {:connection-manager pool-2}))))
      (log-time start piece))))

(def s (atom 0))

(defn test-windshaft []
  (tfuture
    (let [start (System/currentTimeMillis)
          response (http/post base-url
                              {:as                 :json
                               :connection-manager pool-2
                               :headers            {"content-type"     "application/json"
                                                    "x-db-host"        "postgres"
                                                    "x-db-user"        "lumen"
                                                    "x-db-password"    "password"
                                                    "x-db-last-update" 10000
                                                    "x-db-port"        "5432"}
                               :body               (json/generate-string
                                                     {:version "1.5.0",
                                                      :layers  [{:type    "mapnik",
                                                                 :options {:sql              "select instance, geom, yearcons::integer as yearcons from liberia where yearcons ~ '^\\d{4}$';",
                                                                           :geom_column      "geom",
                                                                           :srid             4326,
                                                                           :cartocss         "#s { marker-width: 5; marker-fill:#f45; marker-line-color:#813; marker-allow-overlap:true; marker-fill-opacity: 0.3;} #s[yearcons>=2009] {marker-fill: #1F78B4; marker-line-color: #0000FF;}",
                                                                           :cartocss_version "2.0.0",
                                                                           ;                             :random-number    (rand)
                                                                           :interactivity    "instance"}}]})})
          layer-group-id (-> response :body :layergroupid)]
      (println response)
      (swap! s inc)
      (log-time start "first request")
      (def global-layer layer-group-id)
      (let [reqs [
                  (tile layer-group-id "/0/10/481/493.grid.json")
                  (png layer-group-id "/10/481/493.png")
                  ;(tile layer-group-id "/0/11/969/991.grid.json")
                  ; (tile layer-group-id "/0/0/0/0.grid.json")
                  ;;(tile layer-group-id "/0/1/0/0.grid.json")
                  ;(tile layer-group-id "/0/11/966/990.grid.json")
                  ]]
        (doseq [r reqs]
          @r))
      (log-time start "total")
      (println "all good!"))))

(comment
  (let [reqs [
              ;(tile global-layer "/0/10/481/493.grid.json")
              ;(tile global-layer "/0/11/969/991.grid.json")

              (tile global-layer "/0/0/0/0.grid.json")      ;; slow
              (tile global-layer "/0/1/0/0.grid.json")

              (tile global-layer "/0/11/966/990.grid.json")
              ]]
    (doseq [r reqs]
      @r))

  (png global-layer "/10/480/493.png")
  (png global-layer "/10/483/493.png")
  (png global-layer "/10/483/490.png")
  (tile global-layer "/0/10/481/493.grid.json")
  (tile global-layer "/0/20/481/493.grid.json")


  (dotimes [_ 1000]
    (test-windshaft)))


