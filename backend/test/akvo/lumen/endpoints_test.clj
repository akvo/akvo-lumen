(ns akvo.lumen.endpoints-test
  {:functional true}
  (:require [akvo.lumen.component.tenant-manager :refer (wrap-label-tenant)]
            
            [akvo.lumen.endpoint.aggregation :as e.aggregation]
            [akvo.lumen.endpoint.collection :as e.collection]
            [akvo.lumen.endpoint.library :as e.library]
            [dev.commons :as dev.commons]
            
            [akvo.lumen.fixtures :refer [*tenant-conn* tenant-conn-fixture *error-tracker* error-tracker-fixture]]
            [akvo.lumen.lib :as lib]
                        
            [akvo.lumen.lib.collection :as collection]
            [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.test-utils :refer [import-file] :as tu]

            [cheshire.core :as json]

            
            [clojure.test :refer :all]
            [muuntaja.core :as m]
            [reitit.core :as r]
            [reitit.coercion.spec]
            [reitit.ring :as ring]
            [reitit.ring.coercion :as rrc]
            [reitit.ring.middleware.muuntaja :as muuntaja]

            [ring.middleware.params :as params]

            [ring.mock.request :as mock]))

(defn t1-conn [] (tu/test-tenant-conn (first dev.commons/tenants)))

(use-fixtures :once tenant-conn-fixture error-tracker-fixture)

(def tenant-host "http://t1.lumen.local:3030")

(defrecord Conn [conn]
  p/TenantConnection
  (connection [_ _]
    conn))

(defn opts* [conn]
  {:tenant-manager (Conn. conn)})

(defn url* [api-url]
  (str  "/api" api-url))

(defn router [opts]
  (ring/router
   ["/api"
    (e.aggregation/routes opts)
    (e.library/routes opts)
    (e.collection/routes opts)]
   {:data {:coercion reitit.coercion.spec/coercion
                                        ;           :muuntaja m/instance
           :middleware [wrap-label-tenant
                                        ;                       params/wrap-params
                        rrc/coerce-exceptions-middleware
                        rrc/coerce-request-middleware
                        rrc/coerce-response-middleware]}}))

(defn app* [opts]
  (ring/ring-handler
   (router opts)))


(defn with-body [method uri body & [query-params]]
  (cond->
      {:request-method method
       :uri uri
       :headers {"host" "t1.lumen.local:3030"}
       :server-port 3030,
       :server-name "t1.lumen.local",
       :remote-addr "localhost",
       :scheme :http,
       :body-params body
       :body body}
    query-params (assoc :query-params query-params))
  )
(defn post* [uri body & args]
  (apply with-body :post uri body args))

(defn put* [uri body & args]
  (apply with-body :post uri body args))

(defn get* [uri & [query-params]]
  (cond->
      {:request-method :get
       :server-port 3030,
       :server-name "t1.lumen.local",
       :remote-addr "localhost",
       :scheme :http,
       :headers {"host" "t1.lumen.local:3030"}
       :uri uri}
    query-params (assoc :query-params query-params)))

(deftest aggregation-test
  (let [app (app* (opts* *tenant-conn*))]
    (is (= (app (get* (url* "/library")))
           [:akvo.lumen.lib/ok
	    {:dashboards ()
	     :datasets ()
	     :rasters ()
	     :visualisations ()
	     :collections []}]))
    (let [title "new-col1"
          [a {:keys [title entities id]}] (app (post* (url* "/collections") {:title title}))]
     (is (= [a title entities] [:akvo.lumen.lib/created title []]))
     (is (=  (let [[a {:keys [title id]}] (app (get* (url* (str "/collections/" id))))]
               [a {:title title :id id}])
             [:akvo.lumen.lib/ok
              {:id id
               :title title}])))
    (is (= (app (get* (url* "/aggregation/dataset-id-uuid/barvis-type")))
           {:status 400, :body {:message "No query supplied"}}))))

#_(let [handler (ring/ring-handler
               (ring/router
                ["/library" {:post {:parameters {:body {:jor int?}}
                                    :handler (fn [{{{:keys [jor]} :body} :parameters}]
                                               {:status 200
;                                                :data jor
                                                :body jor}
                                               )}}]
                {:data {:coercion reitit.coercion.spec/coercion
                        :muuntaja m/instance
                        
                        :middleware [
                                     muuntaja/format-request-middleware
                                     rrc/coerce-exceptions-middleware
                                     rrc/coerce-request-middleware
                                     rrc/coerce-response-middleware]}}))]

  (handler #_(mock/request :post "/library" {:jor 1})
           {:request-method :post :uri "/library" :body-params {:jor 40}}))

#_(mock/request :post "/library" {:jor 1})
(comment "dev utils"

  (let [app (app* (opts* (t1-conn)))]
   ;;  (app (get* (url* "/aggregation/dataset-id-uuid/barvis-type")))
   ;; (app (get* (url* "/library")))
   ;;(app (get* (url* "/collections")))
   (let [[res {:keys [id] }] (app (post* (url* "/collections") {:title "other4"}))]
     (app (get* (url* (str "/collections/" id))))

     )
  
   ))

(comment "example getting routes"
  (-> ["/collections"
       ["" {:get {:handler (fn [_]
                             {:status 200
                              :body "ok"})}}]
       ["/:id"
        {:get {:parameters {:path-params {:id string?}}
               :handler (fn [{{:keys [id]} :path-params}]
                          {:status 200
                           :body "ok"})}}]]
      ring/router
      r/routes
      ))
