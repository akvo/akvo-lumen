const scatterSpec = {
  version: 1,
  metricColumnY: null,
  metricColumnX: null,
  datapointLabelColumn: null,
  bucketColumn: null,
  metricAggregation: 'mean', // default to mean,
  axisLabelX: null,
  axisLabelXFromUser: false, // Has the label been manually entered by the user?
  axisLabelY: null,
  axisLabelYFromUser: false,
  filters: [],
};

export default scatterSpec;
