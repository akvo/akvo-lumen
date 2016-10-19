# ADR 004: Using PostgreSQL for storing and querying imported data

# Context

Users _connect_ to a datasource and import their data into the system.
The original idea (inspired by Kibana) was to use ElasticSearch and
its DSL to compute aggregations on-the-fly.

After some iterations we realized that the majority of the imported
data will be _tabular_,that is, rows and columns. This shape of
data fits well in the relational model (database tables).
We also realized that the transformations will be something that
will be computed _ahead of time_ and the resulting values will
be persisted.

Another argument for using the same datastore for metadata and
dataset data is to reduce operational complexity.

# Decision

We'll use PostgreSQL to store dataset metadata and imported data.

# Status

Accepted

# Consequences

* We need to have a highly available PostgreSQL installation in
  production (we can rely on hosted solutions if needed)
