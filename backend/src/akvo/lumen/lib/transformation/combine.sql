-- :name combine-columns :!
UPDATE :i:table-name
SET :i:new-column-name = concat (:i:first-column, :separator, :i:second-column)
