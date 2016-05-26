## Transformations

### core/change-datatype

* args
  * columName (string): `"c<number>"`
  * newType (string): `"number"` | `"date"` | `"text"`
  * defaultValue (string): String representation of a valid default value e.g. `"0"`
  * parseFormat (string): Property used only to parse a date e.g. `"YYYY-MM-DD"`
* onError (string): `"fail"` | `"default-value"` | `"delete-row"`

Examples:

````
{"op": "core/change-datatype",
 "args": {"columnName": "c2",
          "newType": "number",
          "defaultValue": "0"},
 "onError": "default-value"}
````
````
{"op": "core/change-datatype",
 "args": {"columnName": "c1",
          "newType": "date",
          "defaultValue": "0",
          "parseFormat": "YYYY-MM-DD"},
 "onError", "fail"}
````

### core/change-column-title
* args
  * columName (string): `"c<number>"`
  * columnTitle (string): New title
* onError (string): `"fail"`

Examples:

````
{"op": "core/change-column-title",
 "args": {"columnName" "c2",
          "columnTitle" "My column"},
 "onError" "fail"}
````

### core/sort-column

* args
  * columName (string): `"c<number>"`
  * sortDirection (string): `"ASC"` | `"DESC"`
* onError (string): `"fail"`

Examples:

````
{"op": "core/sort-column",
 "args" {"columnName" "c1"
         "sortDirection" "ASC"},
 "onError" "fail"}
````

### core/remove-sort

* args
  * columName (string): `"c<number>"`
* onError (string): `"fail"`

Examples:

````
{"op": "core/remove-sort",
 "args": {"columnName" "c1"},
 "onError": "fail"}
````

### core/filter

 __(WIP)__

* args
  * columName (string): `"c<number>"`
  * filterExpression (string): Filter expression e.g. `"< 10"`, `"contains 'akvo'"`
* onError (string): `"fail"`

On text columns:
 * is: `c2 = 'value'`
 * contains: `c2 ilike '%value%'`

On number columns
* Greater than: `c2 > value`
* is: `c2 = value`
* Less than: `c2 < value`

Examples:

````
{"op": "core/sort-column",
 "args" {"columnName" "c1"
         "filterExpression" "< 10"},
 "onError" "fail"}
````

### core/to-titlecase

* args
  * columName (string): `"c<number>"`
* onError (string): `"default-value"` (identity)

Examples:

````
{"op": "core/to-titlecase"
 "args": {"columnName" "c2"},
 "onError" "default-value"}
````

### core/to-lowercase

* args
  * columName (string): `"c<number>"`
* onError (string): `"default-value"` (identity)

Examples:

````
{"op": "core/to-lowercase"
 "args": {"columnName" "c2"},
 "onError" "default-value"}
````

### core/to-uppercase

* args
  * columName (string): `"c<number>"`
* onError (string): `"default-value"` (identity)

Examples:

````
{"op": "core/to-uppercase"
 "args": {"columnName" "c2"},
 "onError" "default-value"}
````

### core/trim

* args
  * columName (string): `"c<number>"`
* onError (string): `"default-value"` (identity)

Examples:

````
{"op": "core/trim"
 "args": {"columnName" "c2"},
 "onError" "default-value"}
````

### core/trim-doublespace

* args
  * columName (string): `"c<number>"`
* onError (string): `"default-value"` (identity)

Examples:

````
{"op": "core/trim-double"
 "args": {"columnName" "c2"},
 "onError" "default-value"}
````
