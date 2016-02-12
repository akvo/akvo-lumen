import { combineReducers } from 'redux';
import datasets from './datasets';
import visualisations from './visualisations';
import dashboards from './dashboards';
import imports from './imports';

export default combineReducers({
  datasets,
  visualisations,
  dashboards,
  imports,
});
