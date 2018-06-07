-- :name insert-data-source :! :1
INSERT INTO data_source (id, spec) VALUES (gen_random_uuid(), '{}')

-- :name insert-altered-data-source :! :1
INSERT INTO :i:table-name (id, spec, test) VALUES (gen_random_uuid(), '{}', true)

-- :name alter-table-add-test-bool :! :1
ALTER TABLE :i:table-name ADD column test bool

-- :name get-data :? :*
SELECT * FROM :i:table-name

-- :name update-data-source-test :! :1
UPDATE data_source SET test=:i:test
