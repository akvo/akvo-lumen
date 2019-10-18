(ns akvo.lumen.auth
  (:require
   [akvo.lumen.auth.api-authorization :refer [api-authorization]]
   [akvo.lumen.auth.jwt-authentication :refer [jwt-authentication]]
   [akvo.lumen.component.authentication :as authentication]
   [akvo.lumen.protocols :as p]
   [akvo.lumen.util :refer [as-middleware]]
   [clojure.spec.alpha :as s]
   [integrant.core :as ig]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Authentication
;;;
 
(defmethod ig/init-key :akvo.lumen.auth/wrap-jwt-authentication
  [_ opts]
  (as-middleware jwt-authentication opts))

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-jwt-authentication
  [_]
  (s/keys :req-un [::authentication/public-client ::p/authorizer]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Authorization
;;;

(defn authorize
  [handler request opts]
  (api-authorization handler request (select-keys opts [:authorizer])))

(defmethod ig/init-key :akvo.lumen.auth/wrap-authorization
  [_ opts]
  (as-middleware authorize opts))

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-authorization
  [_]
  (s/keys :req-un [::p/authorizer]))
