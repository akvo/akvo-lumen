-- :name all-datasources :? :*
-- :doc Get all datasources
select * from datasources
order by ts;

-- :name insert-datasource :! :n
-- :doc Insert a single datasource returning affected row count
insert into datasources (id, kind, spec)
values (:id, :kind, :spec::jsonb)


-- :name datasource-by-id :? :1
-- :doc Get activity by id
select * from datasources
where id = :id
