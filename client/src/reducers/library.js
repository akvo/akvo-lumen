import { combineReducers } from 'redux';
import datasets from './datasets';
import visualisations from './visualisations';
import dashboards from './dashboards';

export default combineReducers({
  datasets,
  visualisations,
  dashboards,
});
