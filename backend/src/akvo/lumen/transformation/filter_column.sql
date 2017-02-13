-- :name db-filter-column :! :n
-- :doc TODO this filter only works on text columns (see the cast ::text)
DELETE FROM :i:table-name
 WHERE rnum NOT IN (SELECT rnum
                      FROM :i:table-name
                     WHERE :i:column-name::text :sql:filter-fn :filter-val);
