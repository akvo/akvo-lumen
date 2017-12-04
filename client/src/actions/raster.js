import Immutable from 'immutable';
import * as constants from '../constants/raster';
import * as visualisationActions from './visualisation';
import { hideModal } from './activeModal';
import { showNotification } from './notification';
import * as api from '../api';
import * as auth from '../auth';

/*
 * Fetch a raster by id
 * fetchRaster(id)
 * Actions:
 * - FETCH_RASTER_REQUEST { id }
 * - FETCH_RASTER_SUCCESS { raster }
 * - FETCH_RASTER_FAILURE { error, id }
 */
function fetchRasterRequest(id) {
  return {
    type: constants.FETCH_RASTER_REQUEST,
    id,
  };
}

function fetchRasterSuccess(raster) {
  return {
    type: constants.FETCH_RASTER_SUCCESS,
    raster,
  };
}

function fetchRasterFailure(error, id) {
  return {
    type: constants.FETCH_RASTER_FAILURE,
    id,
  };
}

export function fetchRaster(id) {
  return (dispatch) => {
    dispatch(fetchRasterRequest(id));
    return api.get(`/api/rasters/${id}`)
      .then(response => response.json())
      .then((raster) => {
        const immutableRaster = Immutable.fromJS(raster);
        dispatch(fetchRasterSuccess(immutableRaster));
        return immutableRaster;
      })
      .catch(error => dispatch(fetchRasterFailure(error, id)));
  };
}

export function ensureRasterFullyLoaded(id) {
  return (dispatch, getState) => {
    const { rasters } = getState().library;
    if (
      rasters == null ||
      rasters[id] == null) {
      return dispatch(fetchRaster(id));
    }
    return Promise.resolve(rasters[id]);
  };
}

export function updateRasterUploadStatus(status) {
  return {
    type: constants.UPDATE_UPLOAD_STATUS,
    uploadRunning: status,
  };
}

/*
 * Raster import
 * importRaster(dataSource)
 * Actions:
 * IMPORT_RASTER_REQUEST
 * IMPORT_RASTER_SUCCESS
 * IMPORT_RASTER_FAILURE
 */

function importRasterPending(importId, name) {
  const now = Date.now();
  return {
    type: constants.IMPORT_RASTER_PENDING,
    raster: Immutable.fromJS({
      id: importId,
      type: 'raster',
      status: 'PENDING',
      name,
      created: now,
      modified: now,
    }),
  };
}

function importRasterFailure(importId, reason) {
  return {
    type: constants.IMPORT_RASTER_FAILURE,
    importId,
    reason,
    modified: Date.now(),
  };
}

function importRasterSuccess(rasterId, importId) {
  return (dispatch) => {
    dispatch(fetchRaster(rasterId));
    dispatch({
      type: constants.IMPORT_RASTER_SUCCESS,
      rasterId,
      importId,
    });
  };
}

function pollRasterImportStatus(importId, name) {
  return (dispatch) => {
    dispatch(importRasterPending(importId, name));
    api.get(`/api/job_executions/${importId}`)
      .then(response => response.json())
      .then(({ status, reason, rasterId }) => {
        if (status === 'PENDING') {
          setTimeout(() => dispatch(pollRasterImportStatus(importId, name)),
          constants.POLL_INTERVAL);
        } else if (status === 'FAILED') {
          dispatch(importRasterFailure(importId, reason));
        } else if (status === 'OK') {
          dispatch(importRasterSuccess(rasterId, importId));
        }
      })
      .catch(error => dispatch(error));
  };
}

function importRasterRequest(dataSource) {
  return {
    type: constants.IMPORT_RASTER_REQUEST,
    dataSource,
  };
}

export function clearImport() {
  return {
    type: constants.CLEAR_IMPORT,
  };
}

export function importRaster(dataSource) {
  return (dispatch) => {
    dispatch(importRasterRequest(dataSource));
    api.post('/api/rasters', dataSource)
      .then(response => response.json())
      .then(({ importId }) => {
        dispatch(pollRasterImportStatus(importId, dataSource.name));
        dispatch(hideModal());
        dispatch(clearImport());
      });
  };
}

// Currently only name
export function saveRasterSettings(id, { name }) {
  return {
    type: constants.SAVE_SETTINGS,
    raster: {
      id,
      name,
    },
  };
}

// Only name for now.
export function defineRasterSettings({ name }) {
  return {
    type: constants.DEFINE_RASTER_SETTINGS,
    raster: { name },
  };
}

export function selectDataSource(dataSource) {
  return {
    type: constants.SELECT_DATA_SOURCE,
    dataSource,
  };
}

export function nextPage() {
  return {
    type: constants.NEXT_PAGE,
  };
}

export function previousPage() {
  return {
    type: constants.PREVIOUS_PAGE,
  };
}

export function defineDataSource(dataSource) {
  return {
    type: constants.DEFINE_DATA_SOURCE,
    dataSource,
  };
}

export function fetchRastersSuccess(rasters) {
  return {
    type: constants.FETCH_RASTERS_SUCCESS,
    rasters,
  };
}


/* Delete raster actions */

function deleteRasterRequest(id) {
  return {
    type: constants.DELETE_RASTER_REQUEST,
    id,
  };
}

/* Should only remove the raster from the redux store.
   To delete a raster use deleteRaster istead */
function removeRaster(id) {
  return {
    type: constants.REMOVE_RASTER,
    id,
  };
}

function deleteRasterSuccess(id) {
  return (dispatch, getState) => {
    dispatch(removeRaster(id));
    const visualisations = getState().library.visualisations;
    Object.keys(visualisations).forEach((visualisationId) => {
      if (visualisations[visualisationId].rasterId === id) {
        dispatch(visualisationActions.removeVisualisation(visualisationId));
      }
    });
  };
}

function deleteRasterFailure(id, error) {
  return {
    type: constants.DELETE_RASTER_FAILURE,
    id,
    error,
  };
}

export function deleteRaster(id) {
  return (dispatch) => {
    dispatch(deleteRasterRequest(id));
    api.del(`/api/rasters/${id}`)
      .then(response => response.json())
      .then(() => dispatch(deleteRasterSuccess(id)))
      .catch(error => dispatch(deleteRasterFailure(id, error)));
  };
}

/*
 * Update a raster by dispatching `updateRaster(rasterId)`
 */

function updateRasterTogglePending(rasterId) {
  return {
    type: constants.TOGGLE_RASTER_UPDATE_PENDING,
    id: rasterId,
  };
}

function pollRasterUpdateStatus(updateId, rasterId, title) {
  return (dispatch) => {
    api.get(`/api/job_executions/${updateId}`)
      .then(response => response.json())
      .then(({ status, reason }) => {
        if (status === 'PENDING') {
          setTimeout(
            () => dispatch(pollRasterUpdateStatus(updateId, rasterId, title)),
            constants.POLL_INTERVAL
          );
        } else if (status === 'FAILED') {
          dispatch(updateRasterTogglePending(rasterId));
          dispatch(showNotification('error', `Failed to update "${title}": ${reason}`));
        } else if (status === 'OK') {
          dispatch(fetchRaster(rasterId))
            .then(() => dispatch(showNotification('info', `Successfully updated "${title}"`, true)));
        }
      })
      .catch(error => dispatch(error));
  };
}

export function updateRaster(id) {
  return (dispatch, getState) => {
    const title = getState().library.rasters[id].get('name');
    dispatch(showNotification('info', `Updating "${title}"`));
    api.post(`/api/rasters/${id}/update`,
      // Send the refreshToken as part of the update request as a workaround
      // for not being able to get an offline token to the backend. It's TBD
      // how we want to do that.
      { refreshToken: auth.refreshToken() }
    )
      .then(response => response.json())
      .then(({ updateId, error }) => {
        if (updateId != null) {
          dispatch(updateRasterTogglePending(id));
          dispatch(pollRasterUpdateStatus(updateId, id, title));
        } else {
          dispatch(showNotification('error', `Update failed: ${error}`));
        }
      });
  };
}
