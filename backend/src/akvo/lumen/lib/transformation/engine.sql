-- :name add-column :!
ALTER TABLE :i:table-name ADD COLUMN :i:new-column-name :i:column-type;
DEALLOCATE ALL;

-- :name delete-column :!
ALTER TABLE :i:table-name DROP COLUMN :i:column-name;
DEALLOCATE ALL;
