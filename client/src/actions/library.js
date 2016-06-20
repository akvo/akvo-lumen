import fetch from 'isomorphic-fetch';
import Immutable from 'immutable';
import * as constants from '../constants/library';
import { fetchDatasetsSuccess } from './dataset';
import { fetchVisualisationsSuccess } from './visualisation';
import { fetchDashboardsSuccess } from './dashboard';
import headers from './headers';

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

export function fetchLibrary() {
  return (dispatch) => {
    dispatch(fetchLibraryRequest());
    fetch('/api/library', {
      method: 'GET',
      headers: headers(),
    })
    .then(response => response.json())
    .then(library => {
      dispatch(fetchDatasetsSuccess(Immutable.fromJS(library.datasets)));
      dispatch(fetchVisualisationsSuccess(library.visualisations));
      dispatch(fetchDashboardsSuccess(library.dashboards));
    });
//    .catch(error => dispatch(fetchLibraryFailure(error)));
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
