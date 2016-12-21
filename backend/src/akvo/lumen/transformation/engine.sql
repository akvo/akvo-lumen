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

-- :name db-change-data-type :<! :1
SELECT lumen_change_data_type(:table-name, :args, :on-error)


-- :name db-filter-column :! :n
-- :doc TODO this filter only works on text columns (see the cast ::text)
DELETE FROM :i:table-name
 WHERE rnum NOT IN (SELECT rnum
                      FROM :i:table-name
                     WHERE :i:column-name::text :sql:filter-fn :filter-val);

-- :name add-column :!
ALTER TABLE :i:table-name ADD COLUMN :i:new-column-name jsonb;

-- :name combine-columns :!
UPDATE :i:table-name
SET :i:new-column-name = to_jsonb(
    TRIM(COALESCE((:i:first-column ->>0), '') || :separator ||  COALESCE((:i:second-column ->>0), ''))
);

-- :name all-data :?
-- :doc Get all data from a data table
SELECT * FROM :i:table-name

-- :name set-cell-value :! :n
-- :doc Set a cell to be empty (null)
UPDATE :i:table-name SET :i:column-name = :value WHERE rnum=:rnum

-- :name delete-row :!
DELETE FROM :i:table-name WHERE rnum=:rnum
