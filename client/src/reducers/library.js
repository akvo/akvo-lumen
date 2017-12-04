import { combineReducers } from 'redux';
import datasets from './datasets';
import visualisations from './visualisations';
import collections from './collections';
import dashboards from './dashboards';
import rasters from './rasters';
import datasetImport from './datasetImport';

export default combineReducers({
  collections,
  datasets,
  visualisations,
  dashboards,
  rasters,
  datasetImport,
});
