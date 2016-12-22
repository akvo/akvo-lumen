-- :name text-transform :!
UPDATE :i:table-name SET :i:column-name =:i:fn(:i:column-name)

-- :name trim-doublespace :!
UPDATE :i:table-name SET :i:column-name =regexp_replace(:i:column-name, '\s+', ' ', 'g');
