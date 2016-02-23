-- :name insert-visualisation :! :n
-- :doc Insert a single visualisations
INSERT INTO visualisation (id)
VALUES (:id);

-- :name insert-visualisation-data :! :n
-- :doc Insert a single visualisation data
INSERT INTO visualisation_data (id, visualisation, "name", spec)
VALUES (:id, :visualisation, :name, :spec);


-- :name all-visualisations :? :*
-- :doc All visualisations
SELECT v.id, vd.name, v.ts AS created, vd.ts AS modified
FROM visualisation v
LEFT JOIN (
     SELECT DISTINCT ON (v_data.visualisation)
     v_data.name, v_data.visualisation, v_data.spec, v_data.enabled, v_data.ts
     FROM visualisation_data v_data
     ORDER BY v_data.visualisation, v_data.id DESC) vd ON v.id = vd.visualisation
WHERE vd.enabled = 'true';


-- :name visualisation-by-id :? :1
-- :doc grab visualisation by id
SELECT v.id, vd.name, vd.spec, vd.enabled, vd.ts
FROM visualisation v
LEFT JOIN (
SELECT DISTINCT ON (v_data.visualisation)
v_data.name, v_data.visualisation, v_data.spec, v_data.enabled, v_data.ts
FROM visualisation_data v_data
ORDER BY v_data.visualisation, v_data.id DESC) vd ON v.id = vd.visualisation
WHERE vd.enabled = 'true' AND v.id = :id;
