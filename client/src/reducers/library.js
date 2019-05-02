import { combineReducers } from 'redux';
import datasets from './datasets';
import visualisations from './visualisations';
import collections from './collections';
import dashboards from './dashboards';
import rasters from './rasters';
import datasetImport from './datasetImport';
import * as constants from '../constants/library';

export default combineReducers({
  collections,
  datasets,
  visualisations,
  dashboards,
  rasters,
  datasetImport,
  meta: (previousState = { hasFetched: false }, action) => (
    action.type === constants.FETCH_LIBRARY_SUCCESS ?
      { ...previousState, hasFetched: true } :
      previousState
  ),
});
