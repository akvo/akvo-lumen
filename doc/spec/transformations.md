## Transformations

### core/change-datatype

* args
  * columName (string): `"c<number>"`
  * newType (string): `"number"` | `"date"` | `"text"`
  * defaultValue: A valid default value for the `newType` e.g. 0 , "", null, 1464671242
  * parseFormat (string): Property used only to parse a date e.g. `"YYYY-MM-DD"`
* onError (string): `"fail"` | `"default-value"` | `"delete-row"`

Examples:

````
{"op": "core/change-datatype",
 "args": {"columnName": "c2",
          "newType": "number",
          "defaultValue": 0},
 "onError": "default-value"}
````

````
{"op": "core/change-datatype",
 "args": {"columnName": "c1",
          "newType": "date",
          "defaultValue": 0,
          "parseFormat": "YYYY-MM-DD"},
 "onError": "fail"}
````

### core/change-column-title
* args
  * columName (string): `"c<number>"`
  * columnTitle (string): New title
* onError (string): `"fail"`

Examples:

````
{"op": "core/change-column-title",
 "args": {"columnName": "c2",
          "columnTitle": "My column"},
 "onError": "fail"}
````

### core/sort-column

* args
  * columName (string): `"c<number>"`
  * sortDirection (string): `"ASC"` | `"DESC"`
* onError (string): `"fail"`

Examples:

````
{"op": "core/sort-column",
 "args": {"columnName": "c1",
          "sortDirection": "ASC"},
 "onError": "fail"}
````

### core/remove-sort

* args
  * columName (string): `"c<number>"`
* onError (string): `"fail"`

Examples:

````
{"op": "core/remove-sort",
 "args": {"columnName": "c1"},
 "onError": "fail"}
````

### core/filter-column

* args
  * columName (string): `"c<number>"`
  * expression (object): `{"<filter-function>": <val>}` -
  Note: `<val>` must be a valid value for the column
* onError (string): `"fail"`

On text columns:
 * is: `{"is": "Akvo"}`
 * contains: `{"contains": "foundation"}`

On number columns
* Greater than: `{">": 20}`
* is: `{"=": 10}`
* Less than: `{"<": 0}`

Examples:

````
{"op": "core/sort-column",
 "args": {"columnName": "c1",
          "expression": {"<": 10}},
 "onError": "fail"}
````

### core/to-titlecase

* args
  * columName (string): `"c<number>"`
* onError (string): `"default-value"` (identity)

Examples:

````
{"op": "core/to-titlecase",
 "args": {"columnName": "c2"},
 "onError": "default-value"}
````

### core/to-lowercase

* args
  * columName (string): `"c<number>"`
* onError (string): `"default-value"` (identity)

Examples:

````
{"op": "core/to-lowercase",
 "args": {"columnName": "c2"},
 "onError": "default-value"}
````

### core/to-uppercase

* args
  * columName (string): `"c<number>"`
* onError (string): `"default-value"` (identity)

Examples:

````
{"op": "core/to-uppercase",
 "args": {"columnName": "c2"},
 "onError": "default-value"}
````

### core/trim

* args
  * columName (string): `"c<number>"`
* onError (string): `"default-value"` (identity)

Examples:

````
{"op": "core/trim",
 "args": {"columnName": "c2"},
 "onError": "default-value"}
````

### core/trim-doublespace

* args
  * columName (string): `"c<number>"`
* onError (string): `"default-value"` (identity)

Examples:

````
{"op": "core/trim-double",
 "args": {"columnName": "c2"},
 "onError": "default-value"}
````

### core/combine

* args
  * columnNames (vector): `["c1", "c2"]`
  * newColumnTitle (string): `"New title"`
  * seperator (string): `","`
* onError (string): `"fail"`

Examples:

````
{"op": "core/combine",
 "args": {"columnNames": ["c1", "c2"],
          "newColumnTitle": "New title",
          "separator": " "},
 "onError": "fail"}
````

### core/derived

* args
  * newColumnTitle (string): `"New title"`
  * newColumnType (string): `"text"/"number"/"date"`
  * code (string): `"row['a'] + 1"`
* onError (string): `"fail"` | `"delete-row"` | `"leave-empty"`

````
{"op": "core/derive",
 "args": {"newColumnTitle": "New title",
          "newColumnType": "text", // or "date", "number"
          "code": "row['a'] + row['b']"},
 "onError": "fail"}
````

### core/delete-column

* args
  * columnName (string): The column to delete

```
{"op": "core/delete-column",
 "args": {"columnName": "c4"}}
```

### core/rename-column

* args
  * columnName (string): The column to rename
  * newColumnTitle (string): The new column title

```
{"op": "core/rename-column",
 "args": {"columnName": "c4",
          "newColumnTitle": "New Title"}}
```

### core/generate-geopoints

* args
  * columnNameLat (string): The column containing latitude data
  * columnNameLong (string): The column containing longitude data
  * columnTitleGeo (string): The title of the geopoint column to be generated

```
{"op": "core/generate-geopoints",
 "args": {"columnNameLat": "c2",
          "columnNameLong": "c3",
          "columnTitleGeo": "Geopoints"}}
```

### core/merge-datasets

* args
  * source.datasetId (string): The dataset from where columns will be merged
  * source.mergeColumn (string): The merge column in the source dataset
  * source.aggregationColumn (string): If the source merge column is not non-null & unique,
    this column and the aggregation direction determines which row to select for merging
  * source.aggregationDirection (ASC|DESC): sort direction for the aggregation column
  * source.mergeColumns (array or strings): Columns to be added to the target dataset
  * target.mergeColumn (string): The merge column in the target dataset

```
{"op": "core/merge-datasets",
 "args": {"source": {"datasetId" "fjdos-dfios-dkso"
                     "mergeColumn": "c1",
					 "aggregationColumn: "c3",
					 "aggregationDirection: "ASC", // or "DESC"
                     "mergeColumns": ["c2", "c3"]}
          "target": {"mergeColumn": "c1"}}}

```

### core/reverse-geocode

This transformation relies on a "world" table being available in all tenant databases. The following steps will create this table

* Download and unzip the file `g2015_2014_2.zip` from https://console.cloud.google.com/storage/browser/shapefiles?project=akvo-lumen
* Run the command
```
shp2pgsql -I -D -s 4326 -W LATIN1 g2015_2014_2.shp world | psql <tenant-connection-string>
```
* The tenant connection string can be found in the elephantsql dashboard. Replace the default database name with the database name of the tenant.

* args
  * target.datasetId (string): The dataset being reverse geocoded
  * target.geopointColumn (string): The geopoint column to use for reverse geocoding
  * target.title (string): The new column title
  * source.datasetId (string): The dataset id for the shape dataset (source = null) means we will default to the world table
  * source.geoshapeColumn (string): The geoshape column to use for reverse geocoding
  * source.mergeColumn (string): The column to move to the target dataset

```
{"op": "core/reverse-geocode"
 "args": {"target": {"datasetId" "fid-dis-gid"
                     "title": "Adminstrative level 2"},
          // null source means "world" table
          "source": {"datasetId" "abc-sda-dgs",
                     "geoshapeColumn": "d2",
                     "mergeColumn": "c4"}}}
```
