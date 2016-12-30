-- :name insert-tenant :! :n
-- :doc Insert new tenant
INSERT INTO tenants (db_uri, label, title)
VALUES (:db_uri, :label, :title);
