(ns akvo.lumen.endpoint.user
  (:require [akvo.lumen.endpoint.commons.http :as http]
            [akvo.lumen.lib.user :as user]
            [akvo.lumen.lib :as lib]
            [clojure.tools.logging :as log]
            [clojure.spec.alpha :as s]
            [integrant.core :as ig]))

(defn- promote-user? [body]
  (and (contains? body "admin")
       (= true (get body "admin"))))

(defn- demote-user? [body]
  (and (contains? body "admin")
       (not (get body "admin"))))

(defn- change-name? [body]
  (contains? body "name"))

(defn routes [{:keys [authorizer] :as opts}]
  [["/user"
    ["/me" {:patch {:parameters {:body map?}
                    :handler (fn [{tenant :tenant
                                   jwt-claims :jwt-claims
                                   {:strs [firstName id lastName]} :body
                                   :as request}]
                               (user/change-names authorizer tenant jwt-claims id
                                                  firstName lastName))}}]
    ["/admin" {:get {:handler (fn [{tenant :tenant
                                    query-params :query-params}]
                                (let [u (user/user authorizer tenant (get query-params "email"))]
                                  (lib/ok (select-keys u [:admin :email :firstName :id :lastName]))))}}]]
   ["/admin/users"
    ["" {:get {:handler (fn [{tenant :tenant}]
                          (user/users authorizer tenant))}}]
    ["/:id" ["" {:patch {:parameters {:body map?
                                      :path-params {:id string?}}
                         :handler (fn [{tenant :tenant
                                        jwt-claims :jwt-claims
                                        {:keys [id]} :path-params
                                        body :body}]
                                    (cond
                                      (demote-user? body)
                                      (user/demote-user-from-admin authorizer tenant jwt-claims id)
                                      (promote-user? body)
                                      (user/promote-user-to-admin authorizer tenant jwt-claims id)
                                      :else http/not-implemented {}))}
                 :delete {:parameters {:path-params {:id string?}}
                          :handler (fn [{tenant :tenant
                                         jwt-claims :jwt-claims
                                         {:keys [id]} :path-params}]
                                     (user/remove-user authorizer tenant jwt-claims id))}}]]]])

(defmethod ig/init-key :akvo.lumen.endpoint.user/user  [_ opts]
  (routes opts))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.user/user [_]
  (s/keys :req-un [::p/authorizer]))
