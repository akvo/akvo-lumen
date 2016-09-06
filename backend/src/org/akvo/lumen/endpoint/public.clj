(ns org.akvo.lumen.endpoint.public
  (:require [cheshire.core :as json]
            [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.public :as public]
            [ring.util.response :refer [content-type not-found response]]))


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

(defn endpoint [{:keys [tenant-manager]}]
  (context "/s" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/:id" [id]
        (if-let [share (public/share tenant-conn id)]
          (-> (response (html-response share))
              (content-type "text/html; charset=utf-8"))
          (-> (not-found (str "No public share with id: " id))
              (content-type "text/html; charset=utf-8")))))))
