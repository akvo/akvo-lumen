const genericSpec = {
  version: 1,
  metricColumnY: null, // primary
  metricColumnYName: null,
  metricColumnYType: null,
  metricColumnX: null, // secondary
  metricColumnXName: null,
  metricColumnXType: null,
  datapointLabelColumn: null,
  datapointLabelColumnName: null,
  datapointLabelColumnType: null,
  bucketColumn: null,
  bucketColumnName: null,
  bucketColumnType: null,
  subBucketColumn: null,
  subBucketColumnName: null,
  subBucketColumnType: null,
  subBucketMethod: 'split', // can be "split" or "stack"
  metricAggregation: 'mean', // default to mean,
  pointColorColumn: null,
  pointColorMapping: {},
  axisLabelX: null,
  axisLabelXFromUser: false, // Has the label been manually entered by the user?
  axisLabelY: null,
  axisLabelYFromUser: false,
  filters: [],
  sort: null, // can be "asc", "dsc" or "null"
  showLegend: null,
  truncateSize: null,
  longitude: null,
  latitude: null,
};

export default genericSpec;
