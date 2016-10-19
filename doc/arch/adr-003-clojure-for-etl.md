# ADR 003: Using Clojure functions for ETL

# Context

Akvo Lumen is a system that allows the user to connect to different _data
sources_ and import the data. After that user must be able to transform
it (clean, aggregate, etc).
We have been looking at different open source ETL frameworks like:

* [Pentaho Data
  Integration](http://www.pentaho.com/product/data-integration)
* [Clover ETL](http://www.cloveretl.com/)
* [Onyx Platform](http://www.onyxplatform.org/about.html)
* [Bubbles](http://bubbles.databrewery.org/)
* [Kiba ETL](http://www.kiba-etl.org/)

Some of them provide a GUI to build transformations, others require
coding.

There are other ones that are based on Hadoop ecosystem, which is really
too much for our current needs:

* [Luigi](https://luigi.readthedocs.org/en/stable/)
* [Oozie](https://oozie.apache.org/)
* [Azkaban](https://azkaban.github.io/)


# Decision

Based on the skills of the team (Clojure expertise) and the fact Clojure
excels at data transformation. We have decided that a small ad-hoc
functions for handling the import and transformation is enough for our
current needs.

Depending on requirements we'll use a scheduling library like
[Quarzite](https://github.com/michaelklishin/quartzite) for scheduling
imports.

# Status

Accepted

# Consequences

* The current approach will be to create ad-hoc functions to handle
  imports _(extract)_ from different data sources
* If we need a HA setup, there is an easy transition to Onyx Platform.
  See the
[conversation](https://gist.github.com/iperdomo/7af984b9f32c117678de) with Onyx author
