# Release Notes

## 0.5.0 (unreleased)

### Bugfixes

* Fix regression where applied transformations are not reflected in
  the visualisation editor

## 0.4.3

Date 2017-01-10

### Bugfixes

* Fix file upload regression

## 0.4.2

Date 2017-01-10

### New and noteworthy

* New transformation: Delete column
* New transformation: Rename column

### Bugfixes

* Fix broken Pie and Donut charts

## 0.4.1

Date 2017-01-04

### New and noteworthy

* Enabled TLS

### Bugfixes

* Fix a regression in the visualisation editor that prevented viewing maps

## 0.4.0

Date: 2016-12-30

### New and noteworthy

* Improved the Visualisation editor
  * "Save" button no longer redirects user to library view
  * New "Stack" and "Split" options for subgroups in Bar chart editor
  * Number of bars in bar chart can now optionally be limited
  * Aggregations for visualisations are now performed in a separate step
  * Visualisation axis labels now update automatically without user input
* New transformation: Derive column
  * Supports user defined formulas using Javascript as the
    expression language

### Bugfixes

* Make sure the authentication token is up-to-date so the user isn't
  unexpectedly logged out during a session
* DOS-formatted CSV files now import properly


## 0.3.0

Date 2016-12-01

### New and noteworthy

* Implemented continuous integration
* Defined Javascript expressions to be supported in derived columns
* Set up Lumen production database

## 0.2.0

Date: 2016-09-05

### New and noteworthy

* Frontend UI speedup by switching to immutable.js for datasets
* Fixed various issues with Dashboard editor
  * Race condition on cold reload
  * Multiple datasets request on cold load
  * Performance issues
* Fixed issue with Label input in visualisation editor
* Updated Duct framework, using edn files
* Updated Frontend and Backend dependencies


## 0.1.0

Date: 2016-06-24

### New and noteworthy

* Initial release of Akvo Lumen
* Import CSV from a link (URL) or uploading a file
* Import Akvo Flow surveys
* Initial implementation of transformations with support
  for the following transformations:
  * Text filter on a column
  * Remove trailing and leading whitespace
  * Remove double whitespaces
  * Change to Title case, upper case, lower case
  * Change data type: to number, to text, to date
* Initial implementation of visualisations management with
  support for:
  * Charts: Bar, line, scatterplot, pie
  * Maps: Based on lat/lon coordinates
* Support for creatning dashboards
* Support for publishing and sharing via a public link
  visualisations and dashboards

### Known issues

* The authentication is based on Keycloak and hardcoded
  to use https://login.akvotest.org
* Akvo Flow survey import is limited to non monitoring surveys
* When working with transformations the user's browser experience
  an increasing memory consumption on each iteration. This is based
  on the fact that we support history/undo capabilities.
  The proper fix is already a work in progress: Issue #262
