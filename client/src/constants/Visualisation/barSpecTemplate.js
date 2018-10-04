const barSpec = {
  version: 1,
  metricColumnY: null, // primary
  metricColumnX: null, // secondary
  bucketColumn: null,
  subBucketColumn: null,
  subBucketMethod: 'split', // can be "split" or "stack"
  metricAggregation: 'mean', // default to mean,
  axisLabelX: null,
  axisLabelXFromUser: false, // Has the label been manually entered by the user?
  axisLabelY: null,
  axisLabelYFromUser: false,
  legendTitle: null,
  filters: [],
  sort: null, // can be "asc", "dsc" or "null"
  truncateSize: null,
  showLabels: false,
  showValueLabels: false,
};

export default barSpec;
