-- :name db-public-tables :? :*
-- :doc Returns all public tables, except internal system ones
SELECT table_schema || '.' || table_name AS table_name
  FROM information_schema.tables
 WHERE table_schema IN ('public', 'history')
   AND table_type = 'BASE TABLE'
   AND table_name NOT IN ('spatial_ref_sys', 'ragtime_migrations')
