## Visualisation Specifications

### Map Visualisation

```
{
  version: 1,
  "filters": [],
  "showLegend": true,
  "latitude": "c1",
  "longitude": "c2",
  "pointColorColumn": "c6",
  "pointColorMapping": [
{
    op: "equals",
    value: "Male",
    color: "#123321",
},{
    op: "lessThan",
    value: 10,
    color: "#321fff"
},{
    op: "between",
    value: [10, 20],
    color: "#ff0000"
},{
    op: "heatMap",
    value: [0, 100],
    color: ["#ff0000", "#00ff00"]
},
  ],
  "popup": [{
    "header": true,
    "column": "c4"
  }, {
    "column": "c6"
  }, {
    "column": "c12",
    "image": true
  }]
}
```

### Pie and Donut Visualisation

```
{
  version: 1,
  filters: [],
  bucketColumn: 'c1',
  sort: null, // can be "asc", "dsc" or "null"
  showLegend: null,
}
```

### Scatter plot

```
{
  version: 1,
  metricColumnY: 'c4', // required
  metricColumnX: 'c7', // required
  datapointLabelColumn: null, // optional. Used for on-hover labels when no aggregation is defined
  bucketColumn: null,
  metricAggregation: 'mean', // default. Only used when bucketColumn is present
  axisLabelX: null, // Optional string. Automatically generated if not defined by user
  axisLabelXFromUser: false, // Has the label been manually entered by the user?
  axisLabelY: null,
  axisLabelYFromUser: false,
  filters: [],
}
```

### Filter array (used for all visualisation types)

```
{
  "filters": [
    {
      "column": "c6",
      "value": "10", // Always a string
      "operation": "remove", // One of "keep" or "remove"
      "strategy": "isHigher", // One of "isHigher", "isLower", "is", or "isEmpty"
      "caseSensitive": true, // Default, only used when operation is "is"
      "origin": "filterMenu", // Default indicating filter explicitly created by user
    },
    {
      "column": "c2",
      "value": "", // Value is ignored when strategy is "isEmpty"
      "operation": "remove",
      "strategy": "isEmpty",
      "caseSensitive": true,
      "origin": "filterMenu",
    },
    {
      "column": "c10",
      "value": "male",
      "operation": "remove",
      "strategy": "is", // "is" means "exactly matches",
      "caseSensitive": false,
      "origin": "filterMenu",
    },
    {
      "column": "c10",
      "value": "Egypt",
      "operation": "remove",
      "strategy": "is", // "is" means "exactly matches",
      "caseSensitive": true,
      "origin": "pivot", // Filter created by pivot table editor. Won't show in regular filter list
    },
  ],
}
```
