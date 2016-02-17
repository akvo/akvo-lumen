import { combineReducers } from 'redux';
import datasets from './datasets';
import visualisations from './visualisations';
import dashboards from './dashboards';
import datasetImport from './datasetImport';

export default combineReducers({
  datasets,
  visualisations,
  dashboards,
  datasetImport,
});
