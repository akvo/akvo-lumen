-- :name db-to-titlecase :! :n
UPDATE :i:table-name
   SET :i:column-name = titlecase(:i:column-name)

-- :name db-to-lowercase :! :n
UPDATE :i:table-name
   SET :i:column-name = lower(:i:column-name::text)::jsonb

-- :name db-to-upercase :! :n
UPDATE :i:table-name
   SET :i:column-name = upper(:i:column-name::text)::jsonb


-- :name db-trim :! :n
UPDATE :i:table-name
   SET :i:column-name = jsonb_trim(:i:column-name)

-- :name db-trim-double :! :n
UPDATE :i:table-name
   SET :i:column-name = trim_double(:i:column-name)
