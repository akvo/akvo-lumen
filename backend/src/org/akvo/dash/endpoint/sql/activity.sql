-- :name activity-by-id :? :1
-- :doc Get character by id
select * from activity
where id = :id

-- :name insert-activity :! :n
-- :doc Insert a single activity returning affected row count
insert into activity (user_id, event)
values (:user_id, :event::jsonb)
