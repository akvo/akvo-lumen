# Lumen data input format

Lumen currently supports import of data in CSV format either from a local file or from a web address (URL). Lumen will import your data and, to it's best capacity, guess the correct datatype of the CSV columns when importing it, thus saving you time in the data cleaning step.

## File format

A UTF-8 encoded file or file stream containing values separated by a comma `,`.

The first row can include column headers or not. If the file is imported without column headers, these will get names generated automatically (`Column 1, Column 2, Column 3, etc`). (The column names can be changed by the user in the user interface.)

## File source
A file on your local hard drive or a file stream on a URL with http or https.

## How to import data into Lumen
CSV data is imported using `New->Dataset` in the Lumen user interface. Functionality will be added to refresh external data, both manually and on a schedule.

## What you can't do right now

#### Authentication

Lumen does not yet support using external data sources that require authentication for the moment. This functionality is in the roadmap and will be available in some form.

#### Flowing data from CSV

Lumen does not yet support automatic updates of data with transformation and visualizations maintained for the data flow. This functionality is in the roadmap and will be available.

## My data is in XML/JSON/etc. What do I do?

If your data source is an API or a file that returns a different format, we recommend that you create a small web service that will adapt the data to CSV for Lumen.

Akvo intends to publish at least one reference implementation of such a data source adapter and possibly, in the longer term, a number of different adapters that can be used for connecting your Lumen instance to different data sources.
