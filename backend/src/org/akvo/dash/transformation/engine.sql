-- :name db-to-titlecase :! :n
UPDATE :i:table-name
   SET :i:column-name = lumen_titlecase(:i:column-name)

-- :name db-to-lowercase :! :n
UPDATE :i:table-name
   SET :i:column-name = lower(:i:column-name::text)::jsonb

-- :name db-to-upercase :! :n
UPDATE :i:table-name
   SET :i:column-name = upper(:i:column-name::text)::jsonb


-- :name db-trim :! :n
UPDATE :i:table-name
   SET :i:column-name = lumen_trim(:i:column-name)

-- :name db-trim-double :! :n
UPDATE :i:table-name
   SET :i:column-name = lumen_trim_double(:i:column-name)

-- :name db-create-index :!
CREATE INDEX IF NOT EXISTS :i:index-name
    ON :i:table-name (:i:column-name)

-- :name db-drop-index :!
DROP INDEX IF EXISTS :i:index-name CASCADE

-- :name db-change-data-type :<!
SELECT lumen_change_data_type(:table-name, :column-name,
                              :new-type, :default-value::jsonb,
                              :parse-format, :on-error)
