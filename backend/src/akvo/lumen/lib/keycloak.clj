(ns akvo.lumen.lib.keycloak)

(comment
  (ns akvo.lumen.lib.keycloak
    (:require [clojure.pprint :refer [pprint]])
    (:import [org.keycloak.admin.client Keycloak]
             [org.keycloak.representations.idm
              RealmRepresentation
              UserRepresentation]))
  (defn instance
    [server-url realm username password client-id client-secret]
    (Keycloak/getInstance
     server-url realm username password client-id client-secret))

  (def keycloak-instance
    (instance
     "http://localhost:8080/auth"
     "akvo"
     "lumen"
     "password"
     "akvo-lumen-confidential"
     "caed3964-09dd-4752-b0bb-22c8e8ffd631"))


  (-> keycloak-instance
      (.realm "akvo")
      .users)


  (defn realm [keycloak-instance]
    (-> keycloak-instance
        (.realm "akvo")
        (RealmRepresentation/.toRepresentation)))

  (defn users [keycloak-instance]
    (-> keycloak-instance
        (.realm "akvo")
        q.users)
    )

  (let [realm (realm (instance
                      "http://localhost:8080/auth"
                      "akvo"
                      "lumen"
                      "password"
                      "akvo-lumen-confidential"
                      "caed3964-09dd-4752-b0bb-22c8e8ffd631")
                     )]
    (prn (.users realm))
    )


  (defn realm [keycloak-instance]
    (-> keycloak-instance
        (.realm "akvo")
        (RealmRepresentation/.toRepresentation)
        .getRealm))

  (defn instance
    [server-url realm username password client-id client-secret]
    (Keycloak/getInstance
     server-url realm username password client-id client-secret))

  (def k2
    (instance
     "http://localhost:8080/auth"
     "akvo"
     "lumen"
     "password"
     "akvo-lumen-confidential"
     "caed3964-09dd-4752-b0bb-22c8e8ffd631"))

  (-> k2
      (.realm "akvo")
      (RealmRepresentation/.toRepresentation)
      .getUsers)

  (realm k2))
