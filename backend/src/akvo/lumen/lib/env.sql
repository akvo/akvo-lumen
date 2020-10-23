-- :name all-values :? :*
-- :doc All values defined in `environment` table
SELECT id, "value" FROM environment

-- :name db-update-boolean-flag :! :n
-- :doc update env value
update environment set "value"=:value::jsonb where id=:id;

-- :name db-insert-boolean-flag :! :n
-- :doc insert env value
insert into environment(id, "value") VALUES(:id, 'true'::jsonb)


