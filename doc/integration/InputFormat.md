# Lumen data input format

Lumen currently supports input of data in CSV from either a file or from a URL.

## File format

A UTF-8 file or file stream (URL) containing comma separated values. The first row can include column headers or not. Both types of files can be handled on import.

## File source
A file on your local hard drive or a file residing on a URL with http or https.

## What you can't do right now

#### Authentication

Lumen does not yet support using external data sources that require authentication for the moment. This functionality is in the roadmap and will be available in some form.

#### Flowing data from CSV

Lumen does not yet support automatic updates of data with transformation and visualizations maintained for the data flow. This functionality is in the roadmap and will be available.

## My data is in XML/JSON/etc. What do I do?

If your data source is an API or a file that returns a different format, we recommend that you create a data source adapter for Lumen. Akvo intends to publish at least one reference implementation of such an adapter and possibly, in the longer term, a number of different adapters that can be used for connecting your Lumen instance to different data sources.
