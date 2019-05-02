import Immutable from 'immutable';
import warning from 'warning';
import isEmpty from 'lodash/isEmpty';

import * as constants from '../constants/library';
import { fetchDatasetsSuccess } from './dataset';
import { fetchVisualisationsSuccess } from './visualisation';
import { fetchDashboardsSuccess } from './dashboard';
import { fetchCollectionsSuccess } from './collection';
import { fetchRastersSuccess } from './raster';
import * as api from '../utilities/api';

function fetchLibraryRequest() {
  return {
    type: constants.FETCH_LIBRARY_REQUEST,
  };
}

function fetchLibraryFailure() {
  return {
    type: constants.FETCH_LIBRARY_FAILURE,
  };
}

function fetchLibrarySuccess() {
  return {
    type: constants.FETCH_LIBRARY_SUCCESS,
  };
}

// Fetch the library, store it in the redux store and returns a promise¨
// that resolves to the library when all is complete.
export function fetchLibrary() {
  return (dispatch, getState) => {
    dispatch(fetchLibraryRequest());
    return api.get('/api/library')
      .then(({ body }) => {
        const library = body;
        dispatch(fetchDatasetsSuccess(Immutable.fromJS(library.datasets)));
        dispatch(fetchRastersSuccess(Immutable.fromJS(library.rasters)));
        dispatch(fetchVisualisationsSuccess(library.visualisations));
        dispatch(fetchDashboardsSuccess(library.dashboards));
        dispatch(fetchCollectionsSuccess(library.collections));
        dispatch(fetchLibrarySuccess());
        return getState().library;
      })
      .catch((error) => {
        warning(false, 'Failed to fetch library: %s', error.message);
        dispatch(fetchLibraryFailure(error));
      });
  };
}

// Returns a promise (resolved to the library object) when the library
// is loaded into the redux store.
export function ensureLibraryLoaded() {
  return (dispatch, getState) => {
    const { library } = getState();
    if (
      isEmpty(library.datasets) ||
      isEmpty(library.visualisations) ||
      isEmpty(library.dashboards) ||
      isEmpty(library.rasters)
    ) {
      return dispatch(fetchLibrary());
    }
    return Promise.resolve(library);
  };
}

export function changeDisplayMode(displayMode) {
  return {
    type: constants.CHANGE_DISPLAY_MODE,
    displayMode,
  };
}

export function changeSortOrder(sortOrder) {
  return {
    type: constants.CHANGE_SORT_ORDER,
    sortOrder,
  };
}

export function changeFilterBy(filterBy) {
  return {
    type: constants.CHANGE_FILTER_BY,
    filterBy,
  };
}

export function setSearchString(searchString) {
  return {
    type: constants.SET_SEARCH_STRING,
    searchString,
  };
}
