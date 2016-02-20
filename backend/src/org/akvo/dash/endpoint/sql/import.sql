-- :name insert-import :? :1
-- :doc Insert a single import
INSERT INTO imports (id, datasource) -- add data-source
VALUES (DEFAULT, :datasource)
RETURNING id;

-- :name imports-by-datasource :? :*
-- :doc Get import by datasource
SELECT * FROM imports
WHERE datasource = :datasource
ORDER BY ts;

-- :name import-by-id :? :1
-- :doc Get import by id
SELECT * FROM imports
WHERE datasource = :datasource;

-- :name datasource-by-import :? :1
-- :doc Get import job details by import id
SELECT datasources.*
FROM imports
LEFT JOIN datasources
ON imports.datasource=datasources.id
WHERE imports.id = :id;

-- :name import-job :? :1
-- :doc Get import job details by import id
SELECT imports.spec
FROM imports
LEFT JOIN datasources
ON imports.datasource=datasources.id
WHERE imports.id = :id;

-- :name insert-revision :! :n
-- :doc Insert revision
INSERT INTO revisions (digest, content_type, noble, pristine)
VALUES (:digest, :content-type, :noble::jsonb, :pristine::jsonb)

-- :name current-revision-by-datasource :? :*
-- :doc Latest revision data per datasource
SELECT datasources.id AS datasource_id, imports.id AS import_id, imports.revision, revisions.digest, noble, pristine
FROM revisions
LEFT JOIN imports
ON (revisions.digest=imports.revision)
LEFT JOIN datasources
ON (datasources.id=imports.datasource)
WHERE datasources.id = :datasource_id
ORDER BY import_id DESC
LIMIT 1;

-- :name revision-digest-by-digest :? :1
-- :doc Get revision by digest, used to checkfor presence. Does not pull full record.
SELECT digest
FROM revisions
WHERE digest = :digest

-- :name update-import-with-revision :! :n
-- :doc Update import with revision
UPDATE imports
SET revision = :digest, status = :status
WHERE id = :id


-- :name update-import-status :! :n
-- :doc ...
UPDATE imports
SET status = :status
WHERE id = :id
