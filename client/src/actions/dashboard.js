import * as constants from '../constants/dashboard';
import fetch from 'isomorphic-fetch';
import headers from './headers';

export function fetchDashboardsSuccess(dashboards) {
  return {
    type: constants.FETCH_DASHBOARDS_SUCCESS,
    dashboards,
  };
}

function createDashboardSuccess(dashboard) {
  return {
    type: constants.CREATE_DASHBOARD_SUCCESS,
    dashboard,
  };
}

function createDashboardFailure() {
  return {
    type: constants.CREATE_DASHBOARD_FAILURE,
  };
}

function createDashboardRequest(dashboard) {
  return (dispatch) => {
    dispatch({
      type: constants.CREATE_DASHBOARD_REQUEST,
      dashboard,
    });
    fetch('/api/dashboards', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(dashboard),
    })
    .then(response => response.json())
    .then(dash => dispatch(createDashboardSuccess(dash)))
    .catch(err => dispatch(createDashboardFailure(err)));
  };
}

export function createDashboard(dashboard) {
  return createDashboardRequest(dashboard);
}

export function saveDashboardChanges(dashboard) {
  const now = Date.now();

  return {
    type: constants.EDIT,
    dashboard: Object.assign({}, dashboard, {
      modified: now,
    }),
  };
}

function fetchDashboardSuccess(dashboard) {
  return (dispatch) => {
    dispatch({
      type: constants.FETCH_DASHBOARD_SUCCESS,
      dashboard,
    });
  };
}

function fetchDashboardFailure(id) {
  return {
    type: constants.FETCH_DASHBOARD_FAILURE,
    id,
  };
}

function fetchDashboardRequest(id) {
  return {
    type: constants.FETCH_DASHBOARD_REQUEST,
    id,
  };
}

export function fetchDashboard(id) {
  return (dispatch) => {
    dispatch(fetchDashboardRequest(id));
    fetch(`/api/dashboards/${id}`, {
      method: 'GET',
      headers: headers(),
    })
    .then(response => response.json())
    .then(dashboard => dispatch(fetchDashboardSuccess(dashboard)))
    .catch(err => dispatch(fetchDashboardFailure(id, err)));
  };
}

/* Delete dashboard actions */

function deleteDashboardRequest(id) {
  return {
    type: constants.DELETE_DASHBOARD_REQUEST,
    id,
  };
}

/* Should only remove the dashboard from the redux store.
   To delete a dashboard use deleteDashboard istead */
export function removeDashboard(id) {
  return {
    type: constants.REMOVE_DASHBOARD,
    id,
  };
}

function deleteDashboardSuccess(id) {
  return removeDashboard(id);
}

function deleteDashboardFailure(id, error) {
  return {
    type: constants.DELETE_DASHBOARD_FAILURE,
    id,
    error,
  };
}

export function deleteDashboard(id) {
  return (dispatch) => {
    dispatch(deleteDashboardRequest);
    fetch(`/api/dashboards/${id}`, {
      method: 'DELETE',
      headers: headers(),
    })
    .then(response => response.json())
    .then(() => dispatch(deleteDashboardSuccess(id)))
    .catch(error => dispatch(deleteDashboardFailure(id, error)));
  };
}
