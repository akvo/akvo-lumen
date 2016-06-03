(ns org.akvo.dash.endpoint.public
  (:require [cheshire.core :as json]
            [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [org.akvo.dash.endpoint
             [dashboard :refer [handle-dashboard-by-id]]
             [dataset :refer [find-dataset]]
             [visualisation :refer [visualisation]]]
            [ring.util.response :refer [content-type not-found response]]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/public.sql")

(defn get-share
  [conn id]
  (public-by-id conn {:id id}))

(defmulti response-data
  (fn [_ share]
    (cond
      (not (nil? (:visualisation_id share))) :visualisation
      (not (nil? (:dashboard_id share)))     :dashboard)))

(defmethod response-data :visualisation
  [tenant-conn share]
  (let [v (visualisation tenant-conn (:visualisation_id share))
        d (find-dataset tenant-conn (:datasetId v))]
    {"visualisation" (dissoc v :id :created :modified)
     "datasets"      {(:id d) d}}))

(defn- visualisation-id-list
  [dashboard]
  (remove nil? (mapv (fn [m]
                       (if (= (get m "type") "visualisation")
                         (get m "id")))
                     (vals (:entities dashboard)))))

(defn visualisation-list [tenant-conn visualisation-ids]
  (reduce conj {} (map (fn [v-id]
                         {v-id (visualisation tenant-conn v-id)})
                       visualisation-ids)))

(defn dataset-list
  [tenant-conn visualisations]
  (let [dataset-ids (vec (reduce conj #{} (map (fn [v]
                                                 (:datasetId v))
                                               (vals visualisations))))]
    (reduce conj {} (map (fn [d-id]
                           {d-id (find-dataset tenant-conn d-id)})
                         dataset-ids))))

(defmethod response-data :dashboard
  [tenant-conn share]
  (let [dashboard (handle-dashboard-by-id tenant-conn (:dashboard_id share))
        visualisation-ids (visualisation-id-list dashboard)
        visualisations (visualisation-list tenant-conn visualisation-ids)
        datasets (dataset-list tenant-conn visualisations)]
    {"dashboard"      dashboard
     "visualisations" visualisations
     "datasets"       datasets}))

(defn html-response [data]
  (str "<!DOCTYPE html>\n"
       "<html>\n"
       "  <head>\n"
       "  <meta charset=\"utf-8\" />\n"
       "  <meta name=\"robots\" content=\"none\" />\n"
       "  <title>Akvo Lumen</title>\n"
       "  </head>\n"
       "<body>\n"
       "  <div id=\"root\"></div>\n"
       "  <script>\n"
       "window.LUMEN_DATA = "
       (json/encode data)
       ";"
       "  </script>\n"
       "  <script type=\"text/javascript\" src=\"/assets/pub.bundle.js\"></script>"
       "  <link href=\"https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700\" rel=\"stylesheet\" type=\"text/css\">"
       "</body>\n</html>"))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/s" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/:id" [id]
        (if-let [share (get-share tenant-conn id)]
          (-> (response (html-response (response-data tenant-conn share)))
              (content-type "text/html; charset=utf-8"))
          (-> (not-found (str "No public share with id: " id))
              (content-type "text/html; charset=utf-8")))))))
