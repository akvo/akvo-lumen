// TODO: we should have a separate layer spec template for different layer types (eg shape vs point)

const mapLayerSpec = {
  datasetId: null,
  visible: true,
  filters: [],
  title: '', // *Layer* title
  latitude: null,
  longitude: null,
  geom: null,
  pointColorColumn: null,
  pointSize: 3,
  pointColorMapping: [],
  popup: [],
  aggregationMethod: 'avg',
  layerType: 'geo-location',
  legend: {
    title: null,
    visible: true,
  },
};

export default mapLayerSpec;
