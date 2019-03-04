(ns akvo.lumen.endpoints-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [*system* system-fixture *tenant-conn* tenant-conn-fixture *error-tracker* error-tracker-fixture]]
            [akvo.lumen.protocols :as p]
            [clojure.string :as str]
            [cheshire.core :as json]
            [akvo.lumen.test-utils :as tu]
            [clojure.java.io :as io]
            [clojure.test :refer :all]
            [clojure.tools.logging :as log]
            [diehard.core :as dh]
            [reitit.core :as r]
            [reitit.ring :as ring]))

(use-fixtures :once (partial system-fixture "endpoints-test.edn" nil)
  tenant-conn-fixture error-tracker-fixture tu/spec-instrument)

(def tenant-host "http://t1.lumen.local:3030")

(def local-server-path "http://localhost:3100/local-development/local-server/")

(defn local-file [file-name]
  (str local-server-path file-name))

(defn api-url [api-url & args]
  (str  "/api" api-url (when args (str "/" (str/join "/"  args)))))

(defn with-body [method uri body & [query-params]]
  (cond->
      {:request-method method
       :uri uri
       :headers {"host" "t1.lumen.local:3030" "content-type" "application/json"}
       :path-info uri
       :server-port 3030,
       :server-name "t1.lumen.local",
       :remote-addr "localhost",
       :scheme :http,
;;       :body-params body
       :body (io/reader (io/input-stream (.getBytes (json/generate-string body))))}
    query-params (assoc :query-params query-params))
  )
(defn post* [uri body & args]
  (apply with-body :post uri body args))

(defn put* [uri body & args]
  (apply with-body :post uri body args))

(defn >get* [method uri [query-params]]
  (cond->
      {:request-method method
       :server-port 3030,
       :server-name "t1.lumen.local",
       :path-info uri
       :remote-addr "localhost",
       :scheme :http,
       :headers {"host" "t1.lumen.local:3030" "content-type" "application/json"}
       :uri uri}
    query-params (assoc :query-params query-params)))

(defn get* [uri & more]
  (>get* :get uri more))

(defn del* [uri & more]
  (>get* :delete uri more))

(defn job-execution-dataset-id [h job-id]
  (dh/with-retry {:retry-if (fn [v e] (not v))
                                         :max-retries 20
                                         :delay-ms 100}
                           (let [job (-> (h (get* (api-url "/job_executions" job-id)))
                                         :body (json/parse-string keyword))
                                 status (:status job)]
                             (when (= "OK" status)
                               (:datasetId job)))))

(def dataset-link-columns [{:key false,
                            :type "text",
                            :title "Name",
                            :multipleId nil,
                            :hidden false,
                            :multipleType nil,
                            :columnName "c1",
                            :direction nil,
                            :sort nil}
                           {:key false,
                            :type "number",
                            :title "Age",
                            :multipleId nil,
                            :hidden false,
                            :multipleType nil,
                            :columnName "c2",
                            :direction nil,
                            :sort nil}
                           {:key false,
                            :type "number",
                            :title "Score",
                            :multipleId nil,
                            :hidden false,
                            :multipleType nil,
                            :columnName "c3",
                            :direction nil,
                            :sort nil}
                           {:key false,
                            :type "number",
                            :title "Temperature",
                            :multipleId nil,
                            :hidden false,
                            :multipleType nil,
                            :columnName "c4",
                            :direction nil,
                            :sort nil}
                           {:key false,
                            :type "number",
                            :title "Humidity",
                            :multipleId nil,
                            :hidden false,
                            :multipleType nil,
                            :columnName "c5",
                            :direction nil,
                            :sort nil}
                           {:key false,
                            :type "text",
                            :title "Cat",
                            :multipleId nil,
                            :hidden false,
                            :multipleType nil,
                            :columnName "c6",
                            :direction nil,
                            :sort nil}])

;; Todo: generate it with current vis + aggregation specs!!
(defn visualisation-payload [dataset-id vis-type name*]
  {:type "visualisation",
   :name name*,
   :visualisationType vis-type
   :datasetId dataset-id
   :spec {:metricColumnX nil,
          :horizontal false,
          :metricAggregation "count",
          :filters [],
          :axisLabelYFromUser false,
          :bucketColumn nil,
          :showLabels false,
          :metricColumnY nil,
          :subBucketMethod "split",
          :subBucketColumn nil,
          :truncateSize nil,
          :axisLabelX nil,
          :legendTitle nil,
          :axisLabelXFromUser false,
          :axisLabelY nil,
          :version 1,
          :sort nil,
          :showValueLabels false}})

(defn body-kw [res]
  (-> res :body (json/parse-string keyword)))

(deftest handler-test
  (let [h (:handler (:akvo.lumen.component.handler/handler *system*))]
    (testing "/"
      (let [r (h (get*  "/healthz"))]
        (is (= 200 (:status r)))
        (is (= {:healthz "ok", :pod nil, :blue-green-status nil}
               (json/parse-string (:body r) keyword))))
      (let [r (h (get*  "/env"))]
        (is (= 200 (:status r)))
        (is (= {:keycloakClient "akvo-lumen",
                :keycloakURL "http://auth.lumen.local:8080/auth",
                :flowApiUrl "https://api.akvotest.org/flow",
                :piwikSiteId "165",
                :tenant "t1",
                :sentryDSN "dev-sentry-client-dsn"}
               (json/parse-string (:body r) keyword)))))
    (testing "/api"
      (testing "/admin/users"
        (let [users (-> (h (get* (api-url "/admin/users"))) body-kw :users)]
          (is (= '("jerome@t1.lumen.localhost" "salim@t1.lumen.localhost")
                 (sort (map :email users))))))
      
      (let [r (h (get* (api-url "/library")))]
        (is (= 200 (:status r)))
        (is (= {:dashboards []
	        :datasets []
	        :rasters []
	        :visualisations []
	        :collections []}
               (json/parse-string (:body r) keyword))))


      (testing "/dashboards"
        (let [title* "dashboard-title"]
          (let [{:keys [title id]} (-> (h (post*  (api-url "/dashboards") {:type "dashboard"
                                                                           :title title*
                                                                           :entities {}
                                                                           :layout {}}))
                                       :body
                                       (json/parse-string keyword))]

            (is (= title* title))
            (is (= id (-> (h (get* (api-url "/dashboards" id)))
                          :body (json/parse-string keyword) :id))))

          (is (= title* (-> (h (get* (api-url "/library")))
                            :body (json/parse-string keyword) :dashboards first :title)))
          ))


      (testing "/collections"
        (let [title* "col-title"]
          (let [{:keys [title id]} (-> (h (post*  (api-url "/collections") {:title title*}))
                                       :body
                                       (json/parse-string keyword))]
            (is (= title* title))
            (is (= id (-> (h (get* (api-url "/collections" id)))
                          :body (json/parse-string keyword) :id))))

          (is (= title* (-> (h (get* (api-url "/library")))
                            :body (json/parse-string keyword) :collections first :title)))
          ))

      (testing "/multiple-column"
        (is (=
             {:hasImage false, :columns [{:id 1, :name "Alkalinity-m (mg/l)", :type "text"}]}
             (-> (h (get*  (api-url "/multiple-column")
                           {"query" (json/encode {:multipleType "caddisfly"
                                                  :multipleId "85e9bea2-8538-4759-a46a-46459783c2d3"})}))
                 body-kw))))
      (testing "/data-source/job-execution/:id/status/:status"
        (let [dataset-url (local-file "sample-data-1.csv")
              import-id (-> (h (post*  (api-url "/datasets") {:source
                                                              {:kind             "LINK"
                                                               :url              dataset-url
                                                               :hasColumnHeaders true
                                                               :guessColumnTypes true}
                                                              :name "to-delete"}))
                            :body
                            (json/parse-string keyword)
                            :importId)
              _           (is (some? import-id))
              dataset-id (job-execution-dataset-id h import-id)
              _ (is (some? dataset-id))]
          (is (= {} (body-kw (h (del*  (api-url "/data-source/job-execution" import-id "status" "ok"))))))))
      (testing "/datasets"
        (let [title "dataset-title"
              dataset-url (local-file "sample-data-1.csv")
              import-id (-> (h (post*  (api-url "/datasets") {:source
                                                              {:kind "LINK"
                                                               :url dataset-url
                                                               :hasColumnHeaders true
                                                               :guessColumnTypes true}
                                                              :name title}))
                            :body
                            (json/parse-string keyword)
                            :importId)
              _           (is (some? import-id))
              dataset-id (job-execution-dataset-id h import-id)]
          (let [dataset (-> (h (get* (api-url "/datasets" dataset-id)))
                            :body (json/parse-string keyword))]
            (is (= {:transformations []
                    :columns dataset-link-columns
                    :name title
                    ;;:author nil,
                    :rows
                    [["Bob" 22.0 2.0 4.0 7.0 "A"]
                     ["Jane" 34.0 4.0 8.0 2.0 "B"]
                     ["Frank" 55.0 3.0 3.0 6.0 "A"]
                     ["Lisa" 72.0 5.0 1.0 1.0 "B"]]
                    :status "OK"
                    :id dataset-id}
                   (select-keys dataset [:transformations :columns :name :rows :status :id])))
            (is (= {:url dataset-url
                    :kind "LINK"
                    :guessColumnTypes true
                    :hasColumnHeaders true}
                   (select-keys (:source dataset) [:url :kind :guessColumnTypes :hasColumnHeaders])))

            (let [meta-dataset (-> (h (get* (api-url "/datasets" dataset-id "meta")))
                                   :body (json/parse-string keyword))]
              (is (= {:id dataset-id
                      :name title
                      :status "OK"
                      :transformations []
                      :columns dataset-link-columns}
                     (select-keys meta-dataset [:id :name :status :transformations :columns]))))
            (let [update-dataset (-> (h (post* (api-url "/datasets" dataset-id "update") (:source dataset)))
                                     :body (json/parse-string keyword))
                  dataset-id (job-execution-dataset-id h (:updateId update-dataset))]
              (is (some? dataset-id))

              (is (< (:modified dataset ) (-> (h (get* (api-url "/datasets" dataset-id)))
                                              :body (json/parse-string keyword)
                                              :modified)))))
          (is (= title (-> (h (get* (api-url "/library")))
                           :body (json/parse-string keyword) :datasets first :name)))
          (let [bar-vis-name "hello-bar-vis!"]
            (is (= [bar-vis-name dataset-id]
                   (-> (h (post*  (api-url "/visualisations")
                                  (visualisation-payload dataset-id "bar" bar-vis-name)))
                       :body
                       (json/parse-string keyword)
                       ((juxt :name :datasetId)))))
            (let [[name* id*] (-> (h (get* (api-url "/library")))
                                  :body (json/parse-string keyword) :visualisations first                        ((juxt :name :id)))]
              (is (= bar-vis-name name*))
              (testing "/shares"
                (let [share-id (-> (h (post*  (api-url "/shares") {:visualisationId id*}))
                                   :body (json/parse-string keyword)
                                   :id)]
                  (is (some? share-id))
                  (let [{:keys [visualisations datasets visualisationId]} (-> (h (get* (str "/share/" share-id)))
                                                                              :body (json/parse-string keyword))]
                    (is (= visualisationId id*))
                    (is (some? visualisations))
                    (is (some? datasets))
                    )
                  )

                )
              

              ))


          )
        )
      (testing "/split-column/:dataset-id/pattern-analysis"
        (let [dataset-url (local-file "split_column_1785.csv")
              import-id (-> (h (post*  (api-url "/datasets") {:source
                                                              {:kind             "LINK"
                                                               :url              dataset-url
                                                               :hasColumnHeaders true
                                                               :guessColumnTypes true}
                                                              :name "to-delete"}))
                            :body
                            (json/parse-string keyword)
                            :importId)
              _           (is (some? import-id))
              dataset-id (job-execution-dataset-id h import-id)
              _ (is (some? dataset-id))]
          
          (is (= {:analysis ["$" "-"]}
                 (-> (body-kw (h (get* (api-url  "/split-column" dataset-id "pattern-analysis")
                                       {"query" (json/encode {:columnName "c1"})})))
                     (update :analysis (comp vec sort))
                     )))))

      (testing "/admin/invites"
        (let [email "user1@akvo.org"]
          (is (= {:invites []} (body-kw (h (get* (api-url  "/admin/invites"))))))
          (is (= {} (body-kw (h (post*  (api-url "/admin/invites") {:email email})))))
          (let [store @(:store (:akvo.lumen.component.emailer/dev-emailer *system*))
                invitation (last store)]
            (is (= 1 (count store)))
            (is (= email (-> invitation :recipients first)))
            (is (= "Akvo Lumen invite" (-> invitation :email (get "Subject"))))))))))
