(ns akvo.lumen.protocols)

(defprotocol IErrorTracker
  (track [this error]))

(defprotocol TenantConnection
  (connection [this label] "Connection based on a tenant dns label.")
  (uri [this label] "Database URI based on a tenant dns label."))

(defprotocol TenantAdmin
  (current-plan [this label] "Get the current plan."))
