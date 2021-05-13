-- :name all-merge-dsv :? :*
-- :doc all merge-dsv
select distinct on (dataset_id) id, version, dataset_id, transformations from dataset_version where transformations @>  concat ('[{"op": "core/merge-datasets"}]', '')::jsonb order by dataset_id, version desc


-- :name all-merge-dsv-bis :? :*
-- :doc all merge-dsv-bis
 select * from dataset_version where transformations @>  concat ('[{"op": "core/merge-datasets"}]', '')::jsonb
