-- :name drop-null-rows :!
DELETE FROM :i:table-name
      WHERE :i:column-name IS NULL
