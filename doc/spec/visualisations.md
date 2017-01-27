## Visualisation Specifications

### Map Visualisation

```
{
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
  filters: [],
  bucketColumn: 'c1',
  sort: null, // can be "asc", "dsc" or "null"
  showLegend: null,
}
```

