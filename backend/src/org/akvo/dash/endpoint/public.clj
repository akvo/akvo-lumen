(ns org.akvo.dash.endpoint.public
  (:require [cheshire.core :as json]
            [clojure.pprint :refer [pprint]]
            [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [org.akvo.dash.endpoint.dataset :refer [find-dataset]]
            [org.akvo.dash.endpoint.visualisation :refer [visualisation]]
            [org.akvo.dash.endpoint.dashboard :refer [handle-dashboard-by-id]]
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
    (str "window.LUMEN_DATA = "
         (json/encode {"visualisation" (dissoc v :id :created :modified)
                       "datasets"      {(:id d) d}})
         ";")))

;; (defn dashboard-datasets)

(defmethod response-data :dashboard
  [tenant-conn share]
  (let [dashboard         (handle-dashboard-by-id tenant-conn (:dashboard_id share))
        ;; visualisation-ids (filter #(= "visualisation" (get % "type"))
        ;;                           (vals (:entities dashboard)))
        visualisation-ids (filter identity
                                  (into []
                                        (map (fn [m]
                                               (if (= (get m "type")
                                                      "visualisation")
                                                 (get m "id")))
                                             (vals (:entities dashboard)))))
        visualisations    (first (map (fn [v-id]
                                        {v-id (visualisation tenant-conn v-id)})
                                      visualisation-ids))
        datasets          (map (fn [v]
                                 {(:datasetId v)
                                  (find-dataset tenant-conn (:datasetId v))})
                               (vals visualisations))
        resp              {"dashboard"      dashboard
                           "visualisations" visualisations
                           "datasets"       datasets}]
    (println "@response-data:dashboard")
    (pprint resp)

    (str "window.LUMEN_DATA = "
         (json/encode  resp)
         ";")))

(defn html-response [json-litteral]
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
       json-litteral
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
