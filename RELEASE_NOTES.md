# Release Notes

## 0.11.1

### Bugfixes

* Fixed bug in production deployment

## 0.11.0

### New and noteworthy

* Give user feedback on search with no results
* Validate that imported csv files has the same number of columns in each row
* Moved checkbox menu in the Library to the bottom of the screen
* Updated the palette of colors used in visualisations
* On file upload the dropping area is clearly marked
* Renamed "Dataset Editor" menu to "+ Transform"
* Improved transformation performance
* Moved dashboard title input to the header, to match the visualisation title input

### Bugfixes

* Fixed bug where the user would stop being authenticated after keeping lumen open but not using it for 30 minutes
* Fixed a bug where invitation emails to users didn't include the person who invited
* Fixed a bug where some columns for flow imported datasets could not be transformed

## 0.10.1

### Bugfixes

* Fixed bug where the user would stop being authenticated after keeping lumen open but
  not using it for 30 minutes
* Fixed a bug where some columns for flow imported datasets could not be transformed

## 0.10.0

### New and noteworthy

* Improved typography, colors and icons
* Added collections support
* Numeric values are now auto-detected when importing CSV data. Note that if there is any
  data of mixed types, it will be imported as text.

### Bugfixes


## 0.9.0

### New and noteworthy

* Updated favicon to new design
* Initial implementation of Flow integration with importing of flow forms

### Bugfixes

* Fixed bug where long column names would overlap in the Popup editor
  for map visualisations
* Fixed bug where it was not possible to "clear" a search done in the
  Library view
* Use the new spelling of Akvo Flow
* Fix bug where multiple numeric filters would fail to filter the data
  correctly
* Fixed bug where donut charts would not appear in the Dashboard editor

## 0.8.0

### New and noteworthy

* User invitations can now be managed in the admin console
* User invitations can now be revoked
* Added favicon
* Pie chart aggregations are now performed on the backend
* Error tracking with Sentry
* Show full cell values on hover in the dataset view

## 0.7.1

### New and noteworthy
* Admin user actions now present a confirmation dialog
* The list of visualisations in the dashboard editor can now be filtered on title
* Visualisations in the dashboard editor are now sorted by last-modified
* Pivot tables in the dashboard editor can now be resized to a shorter minimum height
* When showing cell values as percentages, pivot tables now only show the count under "Total"
* Visualisations are now more size-responsive
* Dashboard text entities are now more size-responsive
* Visualisaiton titles are now rendered as HTML, with text wrapping
* Bar and pie chart legends can now be given custom titles
* Changed how bar charts resized to accomodate long bar labels and legend titles
* Moved hover-text for Pie charts to bottom of chart when using "show legend"
* Visualisation type is now shown for visualisations in the library view

### Bugfixes

* "Loading" indicator text is no longer hidden behind library menu
* Fixed bug where Map legend entries for number types were sorted incorrectly

## 0.7.0

Date 2017-03-14

### New and noteworthy

* In the Admin console admins can promote and demote users to admin.
* Admin console now supports removing users from the tenant.
* Text entities in dashboards now show line breaks entered by the user
* Dashboard editor no longer redirects to library view when a dashboard is saved
* Increased default visualisation color palette to 20 colors
* Pie chart segments are now more consistent between visualisations, where possible
* Pivot tables improvements:
  * Better text wrapping in header cells
  * Column and row titles are now user-editable
  * Totals are now shown when using sum or count aggregation
  * Cell values can be shown as percentages when using sum or count aggregation
  * Pivot tables show a warning message when more than 50 columns would be generated

### Bugfixes

* Fix bug where pivot tables would fail to load in dashboard editor
* Fix bug where dataset filters would not display correctly in filter list
* Fix bug where percentage values would not display in pie charts
* Fix bug where text entities in dashboards would not display line breaks
* Fix bug where selecting an x-axis column before a y-axis column would break the dashboard editor
* Fix bug where multiple scroll-bars would display when using windows or linux

## 0.6.1

Date 2017-02-24

### New and noteworthy

* Admin view in sidebar is now linked up to a simple overview of what users
  keycloak currently knows about and a form for inviting a user by their
  email address.

### Bugfixes

* Fix bug where pie and donut chart labels would not show percentage values
* Fix bug where pie and donut segments would not show "hover" color when cursor hovered label

## 0.6.0

Date 2017-02-20

### New and noteworthy

* Pivot table visualisations
* Better derived column formula UI feedback

### Bugfixes

* Fixed transformation log description for text transforms

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
