/* Visualisation types for which we don't load the whole dataset, but only request aggregated
** data from the backend */
const aggregationOnlyVisualisationTypes = [
  'pivot table',
  'pie',
  'donut',
  'map',
  'line',
  'area',
  'bar',
  'scatter',
  'bubble',
];

export default aggregationOnlyVisualisationTypes;

