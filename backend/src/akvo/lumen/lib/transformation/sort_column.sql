-- :name db-create-index :!
CREATE INDEX IF NOT EXISTS :i:index-name
    ON :i:table-name (:i:column-name)

-- :name db-drop-index :!
DROP INDEX IF EXISTS :i:index-name CASCADE
