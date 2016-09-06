(ns org.akvo.lumen.endpoint.visualisation
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.visualisation :as visualisation]
            [ring.util.response :refer [not-found response status]]))

#_(ns org.akvo.lumen.endpoint.visualisation
    (:require [compojure.core :refer :all]
            ;; [hugsql.core :as hugsql]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            ;; [org.akvo.lumen.util :refer [squuid]]
            [org.akvo.lumen.lib.visualisation :refer visualisation]
            [ring.util.response :refer [not-found response status]]
            )
  #_(:import [java.sql SQLException])
  )

#_(hugsql/def-db-fns "org/akvo/lumen/endpoint/visualisation.sql")





(defn ok?
  "Msg helper, true for successful message {:ok [...}.."
  [msg]
  (contains? msg :ok))


(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/visualiations" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (response (visualisation/all tenant-conn)))

      (POST "/" {:keys [jwt-claims body]}
        (let [resp (visualisation/create tenant-conn body jwt-claims)]
          (if (ok? resp)
            (response resp)
            (-> (response {:error (:error resp)})
                (status 400)))))

      (context "/:id" [id]

        (GET "/" _
          (let [v (visualisation/fetch tenant-conn id)]
            (if v
              (response v)
              (not-found {:id id}))))

        (PUT "/" {:keys [jwt-claims body]}
          (visualisation/upsert tenant-conn (assoc body "id" id) jwt-claims)
          (response {:id id}))

        (DELETE "/" _
          (let [resp (visualisation/delete tenant-conn id)]
            (if (ok? resp)
              (response (-> :ok first resp))
              (-> (response (:error resp))
                  (status 400)))))))))




#_(defn visualisation
  ""
  [conn id]
  (dissoc (visualisation-by-id conn
                               {:id id}
                               {}
                               {:identifiers identity})
          :author))

#_(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/visualisations" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      #_(GET "/" _
        (response (all-visualisations tenant-conn
                                      {}
                                      {}
                                      {:identifiers identity})))

      #_(POST "/" {:keys [jwt-claims body]}
        (try
          (let [id (squuid)
                resp (first (upsert-visualisation
                             tenant-conn
                             {:id id
                              :dataset-id (get body "datasetId")
                              :type (get body "visualisationType")
                              :name (get body "name")
                              :spec (get body "spec")
                              :author jwt-claims}))]
            (response (assoc body
                             "id" id
                             "status" "OK"
                             "created" (:created resp)
                             "modified" (:modified resp))))
          (catch Exception e
            (.printStackTrace e)
            (when (isa? SQLException (type e))
              (.printStackTrace (.getNextException ^SQLException e)))
            (response {:error e}))))

      (context "/:id" [id]

        #_(GET "/" _
          (if-let [v (visualisation-by-id tenant-conn
                                          {:id id}
                                          {}
                                          {:identifiers identity})]
            (response (dissoc v :author))
            (not-found {:id id})))

        (PUT "/" {:keys [jwt-claims body]}
          (upsert-visualisation tenant-conn
                                {:id id
                                 :dataset-id (get body "datasetId")
                                 :type (get body "visualisationType")
                                 :name (get body "name")
                                 :spec (get body "spec")
                                 :author jwt-claims})
          (response {:id id}))

        (DELETE "/" _
          (try
            (delete-visualisation-by-id tenant-conn {:id id})
            (response {:id id})
            (catch Exception e
              (.printStackTrace e)
              (when (isa? SQLException (type e))
                (.printStackTrace (.getNextException ^SQLException e)))
              (response {:error e}))))))))
