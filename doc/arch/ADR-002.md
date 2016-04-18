# ADR 002: Using ElasticSearch for storing and query imported data

# Context

We need to store the imported data from the _Connect_ process in an
homogeneous way for easy retrieval.

# Decision

After checking how other tools work (like Kibana) it seems that
ElasticSearch is a good choice for storing the imported data.
ElasticSearch has its own DSL for building complex queries and we can
reuse that part.

# Status

Superseded. See [ADR-004](ADR-004.md)

# Consequences

* We need to know how to run and maintain a ElasticSearch cluster
* We need to address the security of the cluster ourselves. Elastic
  has a security plugin but is not open source.
  Examples:
  - http://floragunn.com/searchguard
  - http://keycloak.github.io/docs/userguide/keycloak-server/html/proxy.html
