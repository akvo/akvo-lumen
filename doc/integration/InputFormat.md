# Lumen data input from external sources

Lumen natively supports data import from Akvo Flow, but apart from that, you may have the need to import data from other sources. In these cases, Lumen currently supports import of data in CSV format either from a local file or from a web address (URL). Lumen will import your data and, to it's best capacity, guess the correct datatype of the CSV columns when importing it, thus saving you time in the data cleaning step.

## File format

A valid UTF-8 encoded CSV file containing values separated by a comma `,` where all rows have the same number of columns.

The first row can include column headers or not. If the file is imported without column headers, these will get names generated automatically (`Column 1, Column 2, Column 3, etc`). (The column names can be changed by the user in the user interface.)

## File source
A file on your local hard drive or a file stream on a URL with http or https.

### Authentication

The current support for authentication when loading data from external sources (that are not Akvo Flow) is currently limited to using __url encoded basic auth__. Like this for example:
```
https://Aladdin:OpenSesame@api.example.com/yourdata.csv
```

Support for other authentication methods, like OAuth, is in the roadmap.

## How to import data into Lumen
CSV data is imported using `New->Dataset` in the Lumen user interface. Functionality will be added to refresh external data, both manually and on a schedule.

## Current limitations

#### Flowing data from CSV

Lumen only supports updates of datasets whose origins are flow or CSV imported via http or https (link option in lumen import UI).

#### My data is in XML/JSON/etc. What do I do?

If your data source is an API or a file that returns a different format, you can, if you have the technical capacity in your organization, create a small web service that will adapt the data to CSV for Lumen. In other cases, get in contact with us and we can advise you on how to adopt your data to Lumen.

Akvo intends to publish at least one reference implementation of such a data source adapter and possibly, in the longer term, a number of different adapters that can be used for connecting your Lumen instance to different data sources.
