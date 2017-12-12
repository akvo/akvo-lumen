-- :name reverse-geocode :!
UPDATE :i:target-table-name
   SET :i:target-column-name = :i:source-column-name
  FROM :i:source-table-name
 WHERE ST_Contains(:i:shape-column, :i:point-column)
