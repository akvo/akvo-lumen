-- :name db-to-titlecase :! :n
UPDATE :i:table-name
   SET :i:column-name = titlecase(:i:column-name)

-- :name db-to-lowercase :! :n
UPDATE :i:table-name
   SET :i:column-name = lower(:i:column-name::text)::jsonb

-- :name db-to-upercase :! :n
UPDATE :i:table-name
   SET :i:column-name = upper(:i:column-name::text)::jsonb


-- :name db-remove-lr-whitespace :! :n
UPDATE :i:table-name
   SET :i:column-name = trim_lr(:i:column-name)

-- :name db-remove-double-whitespace :! :n
UPDATE :i:table-name
   SET :i:column-name = trim_double(:i:column-name)
