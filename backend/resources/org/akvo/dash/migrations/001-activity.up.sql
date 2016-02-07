CREATE TABLE activity (
       id SERIAL PRIMARY KEY,
       activity json
);
--;;

GRANT ALL ON activity TO dash;
--;
