(ns org.akvo.dash.endpoint.dashboard
  (:require [compojure.core :refer :all]
            [clojure.pprint :refer [pprint]]
            [clojure.java.jdbc :as jdbc]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [org.akvo.dash.util :refer [squuid]]
            [ring.util.response :as resp]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/dashboard.sql")


;; (defn entity-layout-match?
;;   "Make sure each key in entity have a matching key in layout."
;;   [dashboard]
;;   (= (keys (get dashboard "entities"))
;;      (keys (get dashboard "layout"))))


(defn filter-type
  ""
  [dashboard-data kind]
  (let [entities (filter #(= kind (get % "type"))
                                       (vals (get dashboard-data "entities")))
        ks     (set (map #(get % "id") entities))]
    {:entities entities
     :layout   (keep #(if (ks (get % "i")) %)
                     (vals (get dashboard-data "layout")))}))

(defn part-by-entity-type [entities]
  {:visualisations (filter-type entities "visualisation")
   :text           (filter-type entities "text")})


(defn handle-new-dashboard
  [tenant-conn spec]
  (let [dashboard-id (squuid)
        parted-spec  (part-by-entity-type spec)
        visualisation-layouts (get-in parted-spec [:visualisations :layout])]
    (jdbc/with-db-transaction [tx tenant-conn]
      (insert-dashboard tx {:id    dashboard-id
                            :title (get spec "title")
                            :spec  (:text parted-spec)})
      (doseq [visualisation    (get-in parted-spec [:visualisations :entities])
              visualisation-id (get visualisation "id")
              layout           (filter #(= visualisation-id (get % "i"))
                                       visualisation-layouts)]
        (insert-dashboard_visualisation tx
                                        {:dashboard-id     dashboard-id
                                         :visualisation-id visualisation-id
                                         :layout           layout})))))


(defn endpoint [{:keys [tenant-manager]}]

  (context "/api/dashboards" {:keys [params tenant] :as request}
    (let-routes [conn (connection tenant-manager tenant)]

      (GET "/" _
        (resp/response (all-dashboards conn)))

      (POST "/" {:keys [body]}
        (resp/response (handle-new-dashboard conn body)))

      (context "/:id" [id]

        (GET "/" _
          (resp/response (dashboard-by-id conn {:id id})))

        (PUT "/" _
          (pprint "Update dashboard")
          (resp/response {:status "DID nothing"}))

        (DELETE "/" _
          (delete-dashboard-by-id conn {:id id})
          (resp/response {:status "OK"}))))))
