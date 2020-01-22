CREATE OR REPLACE FUNCTION update_dashboard_filter()
  RETURNS trigger AS
$BODY$
BEGIN
  UPDATE dashboard SET spec=jsonb_set(spec, '{filter}', '{"datasetId": "NULL", "columns":[]}') where (spec::jsonb#>'{filter,datasetId}')::text= concat('"',OLD.id, '"');
  RETURN OLD;
END;
$BODY$ LANGUAGE plpgsql;

CREATE TRIGGER update_dashboard_filter_trigger
  BEFORE DELETE ON dataset
  FOR EACH ROW
  EXECUTE PROCEDURE update_dashboard_filter();
