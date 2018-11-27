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
