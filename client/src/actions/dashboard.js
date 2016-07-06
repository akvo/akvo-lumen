import { createAction } from 'redux-actions';
import * as api from '../api';

export const fetchDashboardsSuccess = createAction('FETCH_DASHBOARDS_SUCCESS');

/* Create a new dashboard */
export const createDashboardRequest = createAction('CREATE_DASHBOARD_REQUEST');
export const createDashboardFailure = createAction('CREATE_DASHBOARD_FAILURE');
export const createDashboardSuccess = createAction('CREATE_DASHBOARD_SUCCESS');

export function createDashboard(dashboard) {
  return (dispatch) => {
    dispatch(createDashboardRequest(dashboard));
    api.post('/api/dashboards', dashboard)
    .then(dash => dispatch(createDashboardSuccess(dash)))
    .catch(err => dispatch(createDashboardFailure(err)));
  };
}

/* Edit an existing dashboard */
export const editDashboardRequest = createAction('EDIT_DASHBOARD_REQUEST');
export const editDashboardFailure = createAction('EDIT_DASHBOARD_FAILURE');
export const editDashboardSuccess = createAction('EDIT_DASHBOARD_SUCCESS');

export function saveDashboardChanges(dashboard) {
  const now = Date.now();
  const dash = Object.assign({}, dashboard, {
    modified: now,
  });
  const id = dash.id;

  return (dispatch) => {
    dispatch(editDashboardRequest);
    api.put(`/api/dashboards/${id}`, dashboard)
    .then(responseDash => dispatch(editDashboardSuccess(responseDash)))
    .catch(error => dispatch(editDashboardFailure(error)));
  };
}

/* Fetch a single dashboard */
export const fetchDashboardRequest = createAction('FETCH_DASHBOARD_REQUEST');
export const fetchDashboardFailure = createAction('FETCH_DASHBOARD_FAILURE');
export const fetchDashboardSuccess = createAction('FETCH_DASHBOARD_SUCCESS');

export function fetchDashboard(id) {
  return (dispatch) => {
    dispatch(fetchDashboardRequest(id));
    api.get(`/api/dashboards/${id}`)
    .then(dashboard => dispatch(fetchDashboardSuccess(dashboard)))
    .catch(err => dispatch(fetchDashboardFailure(err)));
  };
}

/* Delete a dashboard */
export const deleteDashboardRequest = createAction('DELETE_DASHBOARD_REQUEST');
export const deleteDashboardFailure = createAction('DELETE_DASHBOARD_FAILURE');
export const deleteDashboardSuccess = createAction('DELETE_DASHBOARD_SUCCESS');

export function deleteDashboard(id) {
  return (dispatch) => {
    dispatch(deleteDashboardRequest(id));
    api.del(`/api/dashboards/${id}`)
    .then(() => dispatch(deleteDashboardSuccess(id)))
    .catch(error => dispatch(deleteDashboardFailure(error)));
  };
}
