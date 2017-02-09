# Release Notes

## 0.6.0 (Unreleased)

## 0.5.4

Date 2017-02-09

### New and noteworthy

* Empty data values are now displayed as "No data" in maps, bar, pie and donut charts

### Bugfixes

* Fixed bug where color key for maps would not sort properly when it contained empty values

## 0.5.3

Date 2017-02-08

### Bugfixes

* Visualisation filters now work correctly for numeric columns and "exactly matches" filter
* Fix barchart regression for datasets with missing labels
* Fix bug where several copies of a new visualisation could be saved on first save
* Show "Unsaved changes" as soon as the user begins editing the title of a visualisation

## 0.5.2

Date 2017-02-08

### Bugfixes

* The color key for maps is now always presented in the same order

* Don't show "All changes saved" while user is editing the title of a visualisation, as they are not

## 0.5.1

Date 2017-02-07

### Bugfixes

* Improve character encoding detection for csv uploads

## 0.5.0

Date 2017-01-27

### New and noteworthy

* New maps features
  * Overhaul of maps UI
  * Layers for maps (currently limited to single layer)
  * Points on a map can be colored by a text column
  * Custom colors for points
  * Popup text can combine multiple columns, including dates and images

* Visualisation editor simplified for Line and Pie charts

### Bugfixes

* Fixed a bug where the maximum y-axis value was set incorrectly for stacked bar charts when
  using an aggregation method other than "count"

## 0.4.6

Date 2017-01-25

### Bugfixes

* Fixed regression where sharing and flow import where broken

## 0.4.5

Date 2017-01-23

### New and noteworthy

* Moved to a highly available keycloak (single sign-on) instance running on
  the same cloud environment as the rest of lumen

### Bugfixes

* Fixed a bug whereby it was impossible to enter 0 as a default fallback value
  when changing the type of a column


## 0.4.4

Date 2017-01-17

### New and noteworthy

* Client load times optimized by making server to client communication more
  effcient.

### Bugfixes

* Fix transformation log rendering where the log could render the
  wrong title or in some cases not show up at all.

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
