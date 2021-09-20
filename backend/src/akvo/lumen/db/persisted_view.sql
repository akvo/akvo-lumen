-- :name db-get-persisted-view :? :*
-- :doc All persisted views by viz-is
   SELECT persisted_view.id, data_group.columns, data_group.group_id as "group-id", data_group.group_name as "group-name", data_group.table_name as "table-name"
   FROM persisted_view
   JOIN persisted_view_data_group ON persisted_view.id=persisted_view_id
   JOIN data_group ON data_group.id=data_group_id
   where visualisation_id=:id;

-- :name db-insert-persisted-view :! :n
-- :doc insert persisted view
insert into persisted_view(id, visualisation_id, dataset_version_id) VALUES(:id, :visualisation-id, :dataset-version-id)


-- :name db-insert-persisted-view-data-group :! :n
-- :doc insert persisted view data-group
insert into persisted_view_data_group(id, data_group_id, persisted_view_id) VALUES(:id, :data-group-id, :persisted-view-id)
