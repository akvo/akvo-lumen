(ns org.akvo.lumen.lib.public-impl
  (:require [cheshire.core :as json]
            [hugsql.core :as hugsql]
            [org.akvo.lumen.lib.dataset :as dataset]
            [org.akvo.lumen.lib.visualisation :as visualisation]
            [org.akvo.lumen.lib.dashboard :as dashboard]
            [ring.util.response :refer [content-type not-found response]]))


(hugsql/def-db-fns "org/akvo/lumen/lib/public.sql")


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
  (let [v (visualisation/fetch tenant-conn (:visualisation_id share))
        d (dataset/fetch tenant-conn (:datasetId v))]
    {"visualisation" (dissoc v :id :created :modified)
     "datasets"      {(:id d) d}}))

(defn- visualisation-id-list
  [dashboard]
  (->> dashboard
       :entities
       vals
       (filter #(= "visualisation" (get % "type")))
       (mapv #(get % "id"))))

(defn visualisation-list [tenant-conn visualisation-ids]
  (reduce conj {} (map (fn [v-id]
                         {v-id (:body (visualisation/fetch tenant-conn v-id))})
                       visualisation-ids)))

(defn dataset-list
  [tenant-conn visualisations]
  (let [dataset-ids (vec (reduce conj #{} (map :datasetId
                                               (vals visualisations))))]
    (reduce conj {} (map (fn [d-id]
                           {d-id (:body (dataset/fetch tenant-conn d-id))})
                         dataset-ids))))

(defmethod response-data :dashboard
  [tenant-conn share]
  (let [dashboard (:body (dashboard/fetch tenant-conn (:dashboard_id share)))
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
       "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
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

(defn share
  [tenant-conn id]
  (if-let [share (get-share tenant-conn id)]
    (-> (response-data tenant-conn share)
        (html-response)
        (response)
        (content-type "text/html; charset=utf-8"))
    (-> (not-found (str "No public share with id: " id))
        (content-type "text/html; charset=utf-8"))))
