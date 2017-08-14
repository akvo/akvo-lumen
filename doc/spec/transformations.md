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
