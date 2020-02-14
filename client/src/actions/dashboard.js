import { createAction } from 'redux-actions';
import { push } from 'react-router-redux';
import { saveAs } from 'file-saver/FileSaver';

import { addEntitiesToCollection } from './collection';
import { showNotification } from './notification';
import * as api from '../utilities/api';
import { base64ToBlob, extToContentType } from '../utilities/export';

export const fetchDashboardsSuccess = createAction('FETCH_DASHBOARDS_SUCCESS');

/* Create a new dashboard */
export const createDashboardRequest = createAction('CREATE_DASHBOARD_REQUEST');
export const createDashboardFailure = createAction('CREATE_DASHBOARD_FAILURE');
export const createDashboardSuccess = createAction('CREATE_DASHBOARD_SUCCESS');

export function createDashboard(dashboard, collectionId, callback = () => {}) {
  return (dispatch) => {
    dispatch(createDashboardRequest(dashboard));
    api
      .post('/api/dashboards', dashboard)
      .then(({ body }) => {
        const dash = body;
        dispatch(createDashboardSuccess(dash));
        if (collectionId) {
          dispatch(addEntitiesToCollection(dash.id, collectionId));
        }
        dispatch(push(`/dashboard/${dash.id}`));
        callback();
      })
      .catch((err) => {
        dispatch(showNotification('error', 'Failed to create dashboard.'));
        dispatch(createDashboardFailure(err));
        callback(err);
      });
  };
}

/* Edit an existing dashboard */
export const editDashboardRequest = createAction('EDIT_DASHBOARD_REQUEST');
export const editDashboardFailure = createAction('EDIT_DASHBOARD_FAILURE');
export const editDashboardSuccess = createAction('EDIT_DASHBOARD_SUCCESS');

export function saveDashboardChanges(dashboard, callback = () => {}) {
  const dash = JSON.parse(JSON.stringify(dashboard));
  dash.filter.columns.forEach(f => delete f.value); // eslint-disable-line no-param-reassign
  dash.modified = Date.now();

  return (dispatch) => {
    dispatch(editDashboardRequest);
    api
      .put(`/api/dashboards/${dash.id}`, dash)
      .then(({ body }) => {
        dispatch(editDashboardSuccess(body));
        callback();
      })
      .catch((error) => {
        dispatch(showNotification('error', 'Failed to save dashboard.'));
        dispatch(editDashboardFailure(error));
        callback(error);
      });
  };
}

/* Fetch a single dashboard */
export const fetchDashboardRequest = createAction('FETCH_DASHBOARD_REQUEST');
export const fetchDashboardFailure = createAction('FETCH_DASHBOARD_FAILURE');
export const fetchDashboardSuccess = createAction('FETCH_DASHBOARD_SUCCESS');

export function fetchDashboard(id, filter, mergeFilter, callback) {
  return (dispatch) => {
    dispatch(fetchDashboardRequest(id));
    api
      .get(`/api/dashboards/${id}`, {
        query: JSON.stringify(filter),
      })
      .then(({ body }) => {
        const res = body;
        if (mergeFilter) {
          res.filter = filter.filter;
        }
        dispatch(fetchDashboardSuccess(res));
        callback(res);
      })
      .catch((error) => {
        dispatch(showNotification('error', 'Failed to fetch dashboard.'));
        dispatch(fetchDashboardFailure(error));
      });
  };
}

/* Delete a dashboard */
export const deleteDashboardRequest = createAction('DELETE_DASHBOARD_REQUEST');
export const deleteDashboardFailure = createAction('DELETE_DASHBOARD_FAILURE');
export const deleteDashboardSuccess = createAction('DELETE_DASHBOARD_SUCCESS');

export function deleteDashboard(id) {
  return (dispatch) => {
    dispatch(deleteDashboardRequest(id));
    api
      .del(`/api/dashboards/${id}`)
      .then(() => dispatch(deleteDashboardSuccess(id)))
      .catch((error) => {
        dispatch(showNotification('error', 'Failed to delete dashboard.'));
        dispatch(deleteDashboardFailure(error));
      });
  };
}

/* Remove visualisation from dashboard */
export const removeVisualisation = createAction('REMOVE_VISUALISATION_FROM_DASHBOARD');

/* Fetch dashboard share id */
export const fetchShareIdRequest = createAction('FETCH_DASHBOARD_SHARE_ID_REQUEST');
export const fetchShareIdFailure = createAction('FETCH_DASHBOARD_SHARE_ID_FAILURE');
export const fetchShareIdSuccess = createAction('FETCH_DASHBOARD_SHARE_ID_SUCCESS');

export function fetchShareId(dashboardId) {
  return (dispatch) => {
    if (dashboardId != null) {
      api
        .post('/api/shares', { dashboardId })
        .then(({ body }) => {
          dispatch(
            fetchShareIdSuccess({
              id: dashboardId,
              shareId: body.id,
              protected: body.protected,
            })
          );
        })
        .catch(() => {
          dispatch(showNotification('error', 'Failed to fetch share ID for dashboard.'));
        });
    }
  };
}

/* Set dashboard share password */
export const setShareProtectionRequest = createAction('SET_SHARE_PROTECTION_REQUEST');
export const setShareProtectionFailure = createAction('SET_SHARE_PROTECTION_FAILURE');
export const setShareProtectionSuccess = createAction('SET_SHARE_PROTECTION_SUCCESS');

export function setShareProtection(shareId, payload, callback = () => {}) {
  return (dispatch) => {
    if (shareId != null) {
      let isError = false;
      api
        .put(`/api/shares/${shareId}`, payload)
        .then((response) => {
          if (response.status !== 400) {
            dispatch(setShareProtectionSuccess({ shareId, data: payload }));
          }
          if (response.status !== 200) isError = true;
          return response.body;
        })
        .then((body) => {
          if (isError) {
            callback(body);
          } else {
            callback(null, body);
          }
        })
        .catch((error, response) => {
          dispatch(showNotification('error', 'Failed to set share protection for dashboard.'));
          callback(response);
        });
    }
  };
}

/* Export dashboard */
export const exportDashboardRequest = createAction('EXPORT_DASHBOARD_REQUEST');
export const exportDashboardSuccess = createAction('EXPORT_DASHBOARD_SUCCESS');
export const exportDashboardFailure = createAction('EXPORT_DASHBOARD_FAILURE');

export function exportDashboard(dashboard, options) {
  const { format, title } = { format: 'png', title: 'Untitled Dashboard', ...options };
  return (dispatch) => {
    dispatch(exportDashboardRequest({ id: dashboard.id }));

    if (dashboard.id === null) throw new Error('dashboard.id not set');

    const target = `${window.location.origin}/dashboard/${dashboard.id}/export${format === 'pdf' ? '_pages' : ''}`;

    return api
      .post('/api/exports', {
        filter: dashboard.filter,
        format,
        title,
        selector: Object.keys(dashboard.entities)
          .filter(key => dashboard.entities[key].type === 'visualisation')
          .map(key => `.render-completed-${key}`)
          .join(','),
        target,
      })
      .then((response) => {
        if (response.status !== 200) {
          dispatch(showNotification('error', 'Failed to export dashboard.'));
          dispatch(exportDashboardFailure({ id: dashboard.id }));
          return;
        }
        response.text().then((imageStr) => {
          const blob = base64ToBlob(imageStr, extToContentType(format));
          saveAs(blob, `${title}.${format}`);
          dispatch(exportDashboardSuccess({ id: dashboard.id }));
        });
      })
      .catch((error) => {
        dispatch(showNotification('error', 'Failed to export dashboard.'));
        dispatch(exportDashboardFailure(error));
      });
  };
}
