const bubbleSpec = {
  version: 1,
  metricColumn: null,
  bucketColumn: null,
  metricAggregation: 'count', // default to count,
  metricLabel: null,
  metricLabelFromUser: false, // Has the label been manually entered by the user?
  legendTitle: null,
  filters: [],
  truncateSize: null,
  showLegend: true,
  showLabels: false,
  legendPosition: 'right',
};

export default bubbleSpec;
