const lineSpec = {
  version: 1,
  filters: [],
  metricColumnY: null,
  metricColumnX: null,
  metricAggregation: null, // Optional - used when two datapoints have the same x axis value
  axisLabelX: null,
  axisLabelXFromUser: false, // Has the label been manually entered by the user?
  axisLabelY: null,
  axisLabelYFromUser: false,
};

export default lineSpec;
