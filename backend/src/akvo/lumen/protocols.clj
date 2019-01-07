(ns akvo.lumen.protocols)

(defprotocol IErrorTracker
  (track [this error]))

(defprotocol TenantConnection
  (connection [this label] "Connection based on a tenant dns label.")
  (uri [this label] "Database URI based on a tenant dns label."))

(defprotocol TenantAdmin
  (current-plan [this label] "Get the current plan."))

(defprotocol SendEmail
  (send-email [this recipients email] "Send email"))

(defprotocol KeycloakUserManagement
  (add-user-with-email
    [this tenant-label email]
    "Add user to tenant")

  (create-user
    [this request-headers email]
    "Create user")

  (demote-user-from-admin
    [this tenant author-claims user-id]
    "Demote tenant admin to member")

  (promote-user-to-admin
    [this tenant author-claims user-id]
    "Promote existing tenant member to admin")

  (reset-password
    [this request-headers user-id tmp-password]
    "Set temporary user password")

  (remove-user
    [this tenant author-claims user-id]
    "Remove user from tenant")

  (user?
    [this email]
    "Predicate to see if the email has a user in KC")

  (users
    [this tenant-label]
    "List tenants users"))

(defprotocol DatasetImporter
  "
  A protocol for importing datasets into Lumen. A typical implementation
  should also implement `java.io.Closeable` since some data sources are
  backed by resources that need to be released.

  Example:
  (reify
    Closeable
    (close [this])

    DatasetImporter
    (columns [this]
      [{:id :a :type \"text\" :title \"A\"}
       {:id :b :type \"number\" :title \"B\"}
       {:id :c :type \"date\" :title \"C\"}])
    (records [this]
      [{:a \"foo\"
        :b 42
        :c (Instant/now)}
       {:a \"bar\"
        :b 3.14
        :c (Instant/now)}
  "

  (columns [this]
    "Returns a sequence of column specifications of the dataset to be imported.
     A column specification is a map with keys

     Required:
       :type - The lumen type of the column. Currently text, number, date, geoshape or geopoint
       :title - The title of the column
       :id - The internal id of the column (as a keyword). The id must be
             lowercase alphanumeric ([a-z][a-z0-9]*)

     Optional:
       :key - True if this column is required to be non-null and unique")
  (records [this]
    "Returns a sequence of record data. A record is a map of column ids to values.
     The type of the value depends on the type of the column where

       text - java.lang.String
       number - java.lang.Number
       date - java.time.Instant
       geoshape - Geoshape
                   Well-known text (WKT) shape (POLYGON or MULTIPOLYGON)
       geopoint - Geopoint
                   Well-known text (WKT) shape (POINT)"))

(defprotocol CoerceToSql
  (coerce [this]))
