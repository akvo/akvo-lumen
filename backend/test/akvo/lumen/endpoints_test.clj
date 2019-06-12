(ns akvo.lumen.endpoints-test
  {:functional true}
  (:require [akvo.lumen.endpoints-test.commons :as commons :refer (get* patch* del* post* put* body-kw job-execution-dataset-id post-files api-url)]
            [akvo.lumen.fixtures :refer [*system* system-fixture *tenant-conn* tenant-conn-fixture *error-tracker* error-tracker-fixture]]
            [akvo.lumen.test-utils :as tu]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clojure.string :as str]
            [clojure.test :refer :all]
            [clojure.tools.logging :as log]))

(use-fixtures :once (partial system-fixture "endpoints-test.edn")
  tenant-conn-fixture error-tracker-fixture tu/spec-instrument)

(deftest handler-test
  (let [h (:handler (:akvo.lumen.component.handler/handler *system*))]

    (testing "/"
      (testing "/healthz"
        (let [r (h (get*  "/healthz"))]
          (is (= 200 (:status r)))
          (is (= {:healthz "ok", :pod nil, :blue-green-status nil}
                 (body-kw r)))))

      (testing "/env"
        (let [r (h (get*  "/env"))]
          (is (= 200 (:status r)))
          (is (= {:keycloakClient "akvo-lumen",
                  :keycloakURL "http://auth.lumen.local:8080/auth",
                  :flowApiUrl "https://api.akvotest.org/flow",
                  :piwikSiteId "165",
                  :tenant "t1",
                  :sentryDSN "dev-sentry-client-dsn"}
                 (body-kw r))))))

    (testing "/api"
      (testing "/resources"
        (let [res (h (get* (api-url "/resources")))]
          (is (= 200 (:status res)))
          (is (= {:plan {:tier nil},
                  :resources
                  {:numberOfVisualisations 0,
                   :numberOfExternalDatasets 0,
                   :numberOfDashboards 0}}(body-kw res)))))

      (testing "/admin/users"
        (let [users (-> (h (get* (api-url "/admin/users"))) body-kw :users)]
          (is (clojure.set/subset? #{"jerome@t1.lumen.localhost" "salim@t1.lumen.localhost"}
                                   (set (map :email users))))))

      (testing "/library"
        (let [r (h (get* (api-url "/library")))]
          (is (= 200 (:status r)))
          (is (= {:dashboards []
	          :datasets []
	          :rasters []
	          :visualisations []
	          :collections []}
                 (body-kw r)))))

      (testing "/dashboards"
        (let [title* "dashboard-title"]
          (let [{:keys [title id]} (-> (h (post*  (api-url "/dashboards") {:type "dashboard"
                                                                           :title title*
                                                                           :entities {}
                                                                           :layout {}}))
                                       body-kw)]

            (is (= title* title))
            (is (= id (-> (h (get* (api-url "/dashboards" id)))
                          body-kw :id))))

          (is (= title* (-> (h (get* (api-url "/library")))
                             body-kw :dashboards first :title)))
          ))

      (testing "/collections"
        (let [title* "col-title"]
          (let [{:keys [title id]} (-> (h (post*  (api-url "/collections") {:title title*}))
                                       body-kw)]
            (is (= title* title))
            (is (= id (-> (h (get* (api-url "/collections" id)))
                          body-kw :id))))

          (is (= title* (-> (h (get* (api-url "/library")))
                            body-kw :collections first :title)))
          ))

      (testing "/multiple-column"
        (is (=
             {:hasImage false, :columns [{:id 1, :name "Alkalinity-m (mg/l)", :type "text"}]}
             (-> (h (get*  (api-url "/multiple-column")
                           {"query" (json/encode {:multipleType "caddisfly"
                                                  :multipleId "85e9bea2-8538-4759-a46a-46459783c2d3"})}))
                 body-kw))))

      (testing "/data-source/job-execution/:id/status/:status"
        (let [file-name "sample-data-1.csv"
              dataset-url (post-files h file-name)
              import-id (-> (h (post*  (api-url "/datasets")
                                       {:source
                                        {:kind "DATA_FILE",
                                         :hasColumnHeaders true,
                                         :guessColumnTypes true,
                                         :url dataset-url,
                                         :fileName file-name},
                                        :name "testing-job-status"}))
                            body-kw
                            :importId)
              _           (is (some? import-id))
              dataset-id (job-execution-dataset-id h import-id)
              _ (is (some? dataset-id))]
          (is (= {} (body-kw (h (del*  (api-url "/data-source/job-execution" import-id "status" "ok"))))))))

      (testing "/datasets"
        (let [title "dataset-title"
              file-name "sample-data-1.csv"
              dataset-url (post-files h file-name)
              import-id (-> (h (post*  (api-url "/datasets") {:source
                                                              {:kind "DATA_FILE"
                                                               :hasColumnHeaders true
                                                               :guessColumnTypes true
                                                               :url dataset-url
                                                               :fileName file-name}
                                                              :name title}))
                            body-kw
                            :importId)
              _           (is (some? import-id))
              dataset-id (job-execution-dataset-id h import-id)
              ]
          (let [dataset (-> (h (get* (api-url "/datasets" dataset-id)))
                            body-kw)]
            (is (= {:transformations []
                    :columns commons/dataset-link-columns
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
                    :kind "DATA_FILE"
                    :guessColumnTypes true
                    :hasColumnHeaders true}
                   (select-keys (:source dataset) [:url :kind :guessColumnTypes :hasColumnHeaders])))

            (let [meta-dataset (-> (h (get* (api-url "/datasets" dataset-id "meta")))
                                   body-kw)]
              (is (= {:id dataset-id
                      :name title
                      :status "OK"
                      :transformations []
                      :columns commons/dataset-link-columns}
                     (select-keys meta-dataset [:id :name :status :transformations :columns])))))

          (testing "sort"
            (let [dataset-sort (-> (h (get* (api-url "/datasets" dataset-id "sort" "c6" "text") {"limit" "1"}))
                                   body-kw)]
              (is (= '([2 "B"]) dataset-sort)))
            (let [dataset-sort (-> (h (get* (api-url "/datasets" dataset-id "sort" "c6" "text")))
                                   body-kw)]
              (is (= '([2 "B"] [2 "A"]) dataset-sort)))
            (let [dataset-sort (-> (h (get* (api-url "/datasets" dataset-id "sort" "c2" "number")))
                                   body-kw)]
              (is (= {:all 4, :max 72.0, :min 22.0 :uniques 4} dataset-sort))))

          (is (= title (-> (h (get* (api-url "/library")))
                          body-kw :datasets first :name)))
          (let [bar-vis-name "hello-bar-vis!"]
            (is (= [bar-vis-name dataset-id]
                   (-> (h (post*  (api-url "/visualisations")
                                  (commons/visualisation-payload dataset-id "bar" bar-vis-name)))
                       body-kw
                       
                       ((juxt :name :datasetId)))))
            (let [[name* id*] (-> (h (get* (api-url "/library")))
                                  body-kw :visualisations first
                                  ((juxt :name :id)))]
              (is (= bar-vis-name name*))
              (testing "/api/shares && /share" 
                (let [share-id (-> (h (post*  (api-url "/shares") {:visualisationId id*}))
                                   body-kw
                                   :id)]
                  (is (some? share-id))
                  (let [{:keys [visualisations datasets visualisationId]} (-> (h (get* (str "/share/" share-id)))
                                                                              body-kw)]
                    (is (= visualisationId id*))
                    (is (some? visualisations))
                    (is (some? datasets)))))))))

      (testing "/datasets update"
        (let [title "github-sample-data-1"
              file-name "sample-data-1.csv"
              dataset-url "https://raw.githubusercontent.com/akvo/akvo-lumen/develop/client/e2e-test/sample-data-1.csv"

              import-id (-> (h (post*  (api-url "/datasets") {:source
                                                              {:kind "LINK"
                                                               :hasColumnHeaders true
                                                               :guessColumnTypes true
                                                               :url dataset-url}
                                                              :name title}))
                            body-kw
                            :importId)
              _           (is (some? import-id))
              dataset-id (job-execution-dataset-id h import-id)
              dataset (-> (h (get* (api-url "/datasets" dataset-id)))
                            body-kw)
              update-dataset (-> (h (post* (api-url "/datasets" dataset-id "update") (:source dataset)))
                                 body-kw)
              dataset-id (job-execution-dataset-id h (:updateId update-dataset))]

          (is (some? dataset-id))

          (is (< (:modified dataset ) (-> (h (get* (api-url "/datasets" dataset-id)))
                                          body-kw
                                          :modified)))
          (is (= 200 (:status (h (del*  (api-url "/datasets" dataset-id))))))))

      (testing "/files "
        (is (some? (post-files h "dos.csv"))))

      (testing "/rasters"
        (let [file-name "SLV_ppp_v2b_2015_UNadj.tif"
              location  (post-files h file-name)]
          (let [payload  {:source
                          {:kind "GEOTIFF",
                           :url location
                           :fileName file-name},
                          :name "raster1"}
                res (body-kw (h (post*  (api-url "/rasters") payload)))
                ]
            (is (some? (:importId res)))
            (is (= "GEOTIFF" (:kind res)))

            (let [raster-id (job-execution-dataset-id h (:importId res) :rasterId "raster")
                  res-raster (body-kw (h (get* (api-url "/rasters" raster-id))))]
              (is (= (:id res-raster) raster-id))))))

      ;; "/exports" endpoint can't be tested in backend isolation endpoints thus it needs a client side too
      
      (testing "/visualisations & /aggregation/:dataset-id/:visualisation-type"
        (let [visualisations (body-kw (h (get* (api-url "/visualisations"))))
              [vis-id dataset-id keys*] ((juxt :id :datasetId keys) (first visualisations))
              vis-detail (body-kw (h (get* (api-url "/visualisations" vis-id))))]
          (is (= vis-id (:id vis-detail)))
          (is (= 200
                 (:status (h (put* (api-url "/visualisations" vis-id)
                                   (-> vis-detail
                                       (assoc-in  [:spec :axisLabelX] "Age")
                                       (assoc-in  [:spec :bucketColumn] "c2")))))))
          
          (is (= []
                 (-> (h (get* (api-url "/aggregation" dataset-id (:visualisationType vis-detail))
                              {"query" (json/encode (:spec vis-detail))}))
                     body-kw :series first :data)))
          (is (= [{:value 1} {:value 1} {:value 1} {:value 1}]
                 (-> (h (get* (api-url "/aggregation" dataset-id (:visualisationType vis-detail))
                              {"query" (json/encode (assoc (:spec vis-detail)
                                                           :axisLabelX "Age"
                                                           :bucketColumn "c2"))}))
                     body-kw :series first :data)))))

      (testing "/metrics & proper values passed: path and tenant"
        (let [r (h (get*  "/metrics"))]
          (is (= 200 (:status r)))
          (is (some? (re-find #"path=\"/api/aggregation/:dataset-id/:visualisation-type\",tenant=\"t1\""
                              (:body r))))))
      
      (testing "/transformations/:id/transform/:op1/:op2 & /transformations/:id/undo"
        (let [title "GDP-dataset"
              file-name "GDP.csv"
              dataset-url (post-files h file-name)
              import-id (-> (h (post*  (api-url "/datasets") {:source
                                                              {:kind "DATA_FILE"
                                                               :url dataset-url
                                                               :fileName file-name
                                                               :hasColumnHeaders false
                                                               :guessColumnTypes true}
                                                              :name title}))
                            body-kw
                            :importId)
              _           (is (some? import-id))
              dataset-id (job-execution-dataset-id h import-id)]
          (let [dataset (-> (h (get* (api-url "/datasets" dataset-id)))
                            body-kw)]
            (is (= {:transformations []
                    :name title
                    :status "OK"
                    :id dataset-id}
                   (select-keys dataset [:transformations :name :status :id])))
            (is (= 196 (count (:rows dataset))))
            (is (= 10 (count (:columns dataset))))
            (let [res (h (post* (api-url "/transformations" dataset-id "transform" "core/trim")
                                {:args {:columnName "c5"}, :onError "fail", :op "core/trim"}))]

              (is (= 200 (:status res)))
              (let [dataset-job-id (job-execution-dataset-id h (:jobExecutionId (body-kw res)))
                    dataset-txed (body-kw (h (get* (api-url "/datasets" dataset-job-id))))]
                (= "17419000" (->  dataset-txed :rows (get 4)))))

            (let [res (h (post* (api-url "/transformations" dataset-id "undo") {}))]
              (is (= 200 (:status res)))
              (let [dataset-job-id (job-execution-dataset-id h (:jobExecutionId (body-kw res)))
                    dataset-txed (body-kw (h (get* (api-url "/datasets" dataset-job-id))))]
                (= " 17419000 " (->  dataset-txed :rows (get 4))))))))
      
      (testing "/split-column/:dataset-id/pattern-analysis"
        (let [title "patter-analysis"
              file-name "split_column_1785.csv"
              dataset-url (post-files h file-name)
              import-id (-> (h (post*  (api-url "/datasets") {:source
                                                              {:kind             "DATA_FILE"
                                                               :url              dataset-url
                                                               :hasColumnHeaders true
                                                               :fileName file-name
                                                               :guessColumnTypes true}
                                                              :name title}))
                            body-kw
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
        (let [email (str (util/squuid) "@akvo.org")]
          (is (= {:invites []} (body-kw (h (get* (api-url  "/admin/invites"))))))
          (let [res (h (post*  (api-url "/admin/invites") {:email email}))]
            (is (= 200 (:status res)) )
            (is (= {} (body-kw res)))
            (let [store @(:store (:akvo.lumen.component.emailer/dev-emailer *system*))
                  invitation (last store)]
              (is (= 1 (count store)))
              (is (= email (-> invitation :recipients first)))
              (is (= "Akvo Lumen invite" (-> invitation :email (get "Subject"))))             
              (let [url (str/replace (re-find #"https.*+" (-> invitation :email (get "Text-part"))) "https://t1.lumen.local" "")
                    res-verify (h (get* url))]
                (is (= 302 (:status res-verify))))
              (let [users (-> (h (get* (api-url "/admin/users"))) body-kw :users)]
                (is (= 200 (:status (h (del* (api-url "/admin/users" (:id (first (filter #(= email (:email %)) users))))))))))))))
      (testing "import empty csv dataset"
        (let [title "dataset-empty"
              file-name "empty.csv"
              dataset-url (post-files h file-name)
              import-id (-> (h (post*  (api-url "/datasets") {:source
                                                              {:kind "DATA_FILE"
                                                               :hasColumnHeaders true
                                                               :guessColumnTypes true
                                                               :url dataset-url
                                                               :fileName file-name}
                                                              :name title}))
                            body-kw
                            :importId)
              _           (is (some? import-id))
              dataset-id (job-execution-dataset-id h import-id)
              ]
          (let [dataset (-> (h (get* (api-url "/datasets" dataset-id)))
                            body-kw)]
            (is (= {:transformations []
                    :columns [{:key false,
	                       :type "text",
	                       :title "one",
	                       :multipleId nil,
	                       :hidden false,
	                       :multipleType nil,
	                       :columnName "c1",
	                       :direction nil,
	                       :sort nil}
	                      {:key false,
	                       :type "text",
	                       :title "two",
	                       :multipleId nil,
	                       :hidden false,
	                       :multipleType nil,
	                       :columnName "c2",
	                       :direction nil,
	                       :sort nil}]
                    :name title
                    ;;:author nil,
                    :rows
                    []
                    :status "OK"
                    :id dataset-id}
                   (select-keys dataset [:transformations :columns :name :rows :status :id])))))))))
