-- :name datasource-by-import :? :1
-- :doc Get import job details by import id
SELECT datasources.*
FROM imports
LEFT JOIN datasources
ON imports.datasource=datasources.id
WHERE imports.id = :id;


-- :name revision-digest-by-digest :? :1
-- :doc Get revision by digest, used to checkfor presence. Does not pull full record.
SELECT digest
FROM revisions
WHERE digest = :digest;


-- :name update-import-with-revision :! :n
-- :doc Update import with revision
UPDATE imports
SET revision = :digest, status = :status
WHERE id = :id


-- :name insert-revision :! :n
-- :doc Insert revision
INSERT INTO revisions (digest, content_type, noble, pristine)
VALUES (:digest, :content-type, :noble::jsonb, :pristine::jsonb)


-- :name update-import-status :! :n
-- :doc ...
UPDATE imports
SET status = :status
WHERE id = :id
