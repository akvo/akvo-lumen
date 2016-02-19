CREATE TABLE revisions (
       digest text PRIMARY KEY, -- digest on the pristine import
       content_type text NOT NULL,
       noble jsonb, -- a rewined version of pristine
       pristine jsonb, -- raw import reference
       ts timestamptz DEFAULT now()
);
--;

GRANT ALL ON revisions to dash;
--;
