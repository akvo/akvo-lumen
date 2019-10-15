## Visualisation Specifications

### Map

```
{
  version: 1,
  awaitingResponse: false, // True when requested update from backend/windshaft but not received yet
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

### Pie and Donut chart

```
{
  version: 1,
  filters: [],
  bucketColumn: 'c1',
  sort: null, // can be "asc", "dsc" or "null"
  showLegend: null,
  legendTitle: null, // optional string max 32 chars
  data: {}, // Aggregated data response from backend. Never mutate this, clone it instead
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
  axisLabelX: null, // optional string. Automatically generated if not defined by user
  axisLabelXFromUser: false, // Has the label been manually entered by the user?
  axisLabelY: null,
  axisLabelYFromUser: false,
  filters: [],
}
```

### Bar chart

```
{
  version: 1,
  metricColumnY: 'c2', // required
  metricColumnX: 'c6', // requijred
  bucketColumn: 'c9', // required
  subBucketColumn: null, // optional, type text
  subBucketMethod: 'split', // optional, can be "split" or "stack"
  metricAggregation: 'mean', // default to mean,
  axisLabelX: null, // optional string. Automatically generated if not defined by user
  axisLabelXFromUser: false, // Has the label been manually entered by the user?
  axisLabelY: null,
  axisLabelYFromUser: false,
  legendTitle: null, // optional string max 32 chars
  filters: [],
  sort: null, // can be "asc", "dsc" or null
  truncateSize: '10', // optional, used to indicate how many bars to show when
}

```

### Pivot table

```
{
  version: 1,
  filters: [],
  aggregation: 'count',
  valueColumn: null, // required if aggregation is other than 'count'
  categoryColumn: null, // required
  categoryTitle: null, // required
  rowColumn: null, // Optional, will use categoryColumn title if ommited
  rowTitle: null, // Optional, will use rowColumn title if ommited
  decimalPlaces: 3, // Only used at render-time
  valueDisplay: 'default', // One of "default", "percentageRow", "percentageColumn", "percentageTotal"
  hideRowTotals: false, // Row and Column totals will still be calculated, but then hidden with css
  hideColumnTotals: false,
  data: {}, // Aggregated data response from backend. Never mutate this, clone it instead
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
