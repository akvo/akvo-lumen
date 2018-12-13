import Immutable from 'immutable';
import * as constants from '../constants/dataset';
import * as visualisationActions from './visualisation';
import { hideModal } from './activeModal';
import applyTransformation from '../reducers/transform';
import { showNotification } from './notification';
import {
  addEntitiesToCollection,
  addTemporaryEntitiesToCollection,
  removeTemporaryEntitiesFromCollection,
} from './collection';
import * as api from '../utilities/api';
import * as auth from '../utilities/auth';

/*
 * Fetch a dataset by id
 * fetchDataset(id)
 * Actions:
 * - FETCH_DATASET_REQUEST { id }
 * - FETCH_DATASET_SUCCESS { dataset }
 * - FETCH_DATASET_FAILURE { error, id }
 */
function fetchDatasetRequest(id) {
  return {
    type: constants.FETCH_DATASET_REQUEST,
    id,
  };
}

function fetchDatasetSuccess(dataset) {
  return {
    type: constants.FETCH_DATASET_SUCCESS,
    dataset,
  };
}

function fetchDatasetFailure(error, id) {
  return {
    type: constants.FETCH_DATASET_FAILURE,
    id,
  };
}

export function fetchDataset(id, metaOnly) {
  const suffix = metaOnly ? '/meta' : '';
  return (dispatch) => {
    dispatch(fetchDatasetRequest(id));
    return api.get(`/api/datasets/${id}${suffix}`)
      .then(response => response.json())
      .then((dataset) => {
        const immutableDataset = Immutable.fromJS(dataset);
        dispatch(fetchDatasetSuccess(immutableDataset));
        return immutableDataset;
      })
      .catch(error => dispatch(fetchDatasetFailure(error, id)));
  };
}

export function ensureDatasetFullyLoaded(id) {
  return (dispatch, getState) => {
    const { datasets } = getState().library;
    if (datasets == null || datasets[id] == null || datasets[id].get('columns') == null) {
      return dispatch(fetchDataset(id));
    }
    return Promise.resolve(datasets[id]);
  };
}

export function updateDatasetUploadStatus(status) {
  return {
    type: constants.UPDATE_UPLOAD_STATUS,
    uploadRunning: status,
  };
}

/*
 * Dataset import
 * importDataset(dataSource)
 * Actions:
 * IMPORT_DATASET_REQUEST
 * IMPORT_DATASET_SUCCESS
 * IMPORT_DATASET_FAILURE
 */

function importDatasetPending(importId, name) {
  const now = Date.now();
  return {
    type: constants.IMPORT_DATASET_PENDING,
    dataset: Immutable.fromJS({
      id: importId,
      type: 'dataset',
      status: 'PENDING',
      name,
      created: now,
      modified: now,
    }),
  };
}

function importDatasetFailure(importId, reason) {
  return {
    type: constants.IMPORT_DATASET_FAILURE,
    importId,
    reason,
    modified: Date.now(),
  };
}

function importDatasetSuccess(datasetId, importId, collectionId) {
  return (dispatch) => {
    dispatch(fetchDataset(datasetId));
    dispatch({
      type: constants.IMPORT_DATASET_SUCCESS,
      datasetId,
      importId,
    });
    if (collectionId) {
      dispatch(removeTemporaryEntitiesFromCollection(importId, collectionId));
      dispatch(addEntitiesToCollection(datasetId, collectionId));
    }
  };
}

function pollDatasetImportStatus(importId, name, collectionId) {
  return (dispatch) => {
    dispatch(importDatasetPending(importId, name));
    if (collectionId) {
      dispatch(addTemporaryEntitiesToCollection(importId, collectionId));
    }
    api
      .get(`/api/job_executions/${importId}`)
      .then(response => response.json())
      .then(({ status, reason, datasetId }) => {
        if (status === 'PENDING') {
          setTimeout(
            () => dispatch(pollDatasetImportStatus(importId, name, collectionId)),
            constants.POLL_INTERVAL
          );
        } else if (status === 'FAILED') {
          dispatch(importDatasetFailure(importId, reason));
        } else if (status === 'OK') {
          dispatch(importDatasetSuccess(datasetId, importId, collectionId));
        }
      })
      .catch(error => dispatch(importDatasetFailure(importId, error.message)));
  };
}

function importDatasetRequest(dataSource) {
  return {
    type: constants.IMPORT_DATASET_REQUEST,
    dataSource,
  };
}

export function clearImport() {
  return {
    type: constants.CLEAR_IMPORT,
  };
}

export function importDataset(dataSource, collectionId) {
  return (dispatch) => {
    dispatch(importDatasetRequest(dataSource, collectionId));
    api
      .post('/api/datasets', dataSource)
      .then(response => response.json())
      .then(({ importId }) => {
        dispatch(pollDatasetImportStatus(importId, dataSource.name, collectionId));
        dispatch(hideModal());
        dispatch(clearImport());
      });
  };
}

// Currently only name
export function saveDatasetSettings(id, { name }) {
  return {
    type: constants.SAVE_SETTINGS,
    dataset: {
      id,
      name,
    },
  };
}

// Only name for now.
export function defineDatasetSettings({ name }) {
  return {
    type: constants.DEFINE_DATASET_SETTINGS,
    dataset: { name },
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

export function fetchDatasetsSuccess(datasets) {
  return {
    type: constants.FETCH_DATASETS_SUCCESS,
    datasets,
  };
}

/* Delete dataset actions */

function deleteDatasetRequest(id) {
  return {
    type: constants.DELETE_DATASET_REQUEST,
    id,
  };
}

/* Should only remove the dataset from the redux store.
   To delete a dataset use deleteDataset istead */
function removeDataset(id) {
  return {
    type: constants.REMOVE_DATASET,
    id,
  };
}

function deleteDatasetSuccess(id) {
  return (dispatch, getState) => {
    dispatch(removeDataset(id));
    const visualisations = getState().library.visualisations;
    Object.keys(visualisations).forEach((visualisationId) => {
      if (visualisations[visualisationId].datasetId === id) {
        dispatch(visualisationActions.removeVisualisation(visualisationId));
      }
      if (visualisations[visualisationId].visualisationType === 'map') {
        const viz = visualisations[visualisationId];

        if (viz.spec && viz.spec.layers && viz.spec.layers.some(layer => layer.datasetId === id)) {
          dispatch(visualisationActions.removeVisualisation(visualisationId));
        }
      }
    });
  };
}

function deleteDatasetFailure(id, error) {
  return {
    type: constants.DELETE_DATASET_FAILURE,
    id,
    error,
  };
}

export function deleteDataset(id) {
  return (dispatch) => {
    dispatch(deleteDatasetRequest(id));
    api
      .del(`/api/datasets/${id}`)
      .then((response) => {
        if (response.status >= 400) {
          response.json().then((error) => {
            dispatch(deleteDatasetFailure(id, error));
            dispatch(showNotification('error', `deletion failed: ${error.error}.`));
          });
        } else {
          response.json().then(() => dispatch(deleteDatasetSuccess(id)));
        }
      })
    ;
  };
}

function deletePendingDatasetSuccess(id) {
  return (dispatch) => {
    dispatch(removeDataset(id));
  };
}

function deletePendingDatasetFailure(id, error) {
  return {
    type: constants.DELETE_DATASET_FAILURE,
    id,
    error,
  };
}

function deleteFailedDatasetFailure(id, error) {
  return {
    type: constants.DELETE_DATASET_FAILURE,
    id,
    error,
  };
}

export function deletePendingDataset(id) {
  return (dispatch) => {
    dispatch(deleteDatasetRequest(id));
    api
      .del(`/api/data-source/job-execution/${id}/status/pending`)
      .then(response => response.json())
      .then(() => dispatch(deletePendingDatasetSuccess(id)))
      .catch(error => dispatch(deletePendingDatasetFailure(id, error)));
  };
}

export function deleteFailedDataset(id) {
  return (dispatch) => {
    dispatch(deleteDatasetRequest(id));
    api
      .del(`/api/data-source/job-execution/${id}/status/failed`)
      .then(response => response.json())
      .then(() => dispatch(removeDataset(id)))
      .catch(error => dispatch(deleteFailedDatasetFailure(id, error)));
  };
}


export function updateDatasetMetaRequest(id) {
  return {
    type: constants.UPDATE_DATASET_META_REQUEST,
    id,
  };
}

export function updateDatasetMetaSuccess(id, meta) {
  return {
    type: constants.UPDATE_DATASET_META_SUCCESS,
    id,
    meta,
  };
}

export function updateDatasetMetaFailure(id, error) {
  return {
    type: constants.UPDATE_DATASET_META_FAILURE,
    id,
    error,
  };
}

export function updateDatasetMeta(id, meta, callback = () => {}) {
  return (dispatch, getState) => {
    dispatch(updateDatasetMetaRequest(id));
    api
      .put(`/api/datasets/${id}`, meta)
      .then(response => response.json())
      .then(() => {
        dispatch(updateDatasetMetaSuccess(id, meta));
        callback();
      })
      .catch((error) => {
        const title = getState().library.datasets[id].get('name');
        dispatch(showNotification('error', `Failed to update "${title}": ${error.message}`));
        dispatch(updateDatasetMetaFailure(id, error));
        callback(error);
      });
  };
}

/*
 * Update a dataset by dispatching `updateDataset(datasetId)`
 */

function updateDatasetTogglePending(datasetId) {
  return {
    type: constants.TOGGLE_DATASET_UPDATE_PENDING,
    id: datasetId,
  };
}

function pollDatasetUpdateStatus(updateId, datasetId, title) {
  return (dispatch) => {
    api
      .get(`/api/job_executions/${updateId}`)
      .then(response => response.json())
      .then(({ status, reason }) => {
        if (status === 'PENDING') {
          setTimeout(
            () => dispatch(pollDatasetUpdateStatus(updateId, datasetId, title)),
            constants.POLL_INTERVAL
          );
        } else if (status === 'FAILED') {
          dispatch(updateDatasetTogglePending(datasetId));
          dispatch(showNotification('error', `Failed to update "${title}": ${reason}`));
        } else if (status === 'OK') {
          dispatch(fetchDataset(datasetId)).then(() =>
            dispatch(showNotification('info', `Successfully updated "${title}"`, true))
          );
        }
      })
      .catch(error => dispatch(error));
  };
}

export function updateDataset(id) {
  return (dispatch, getState) => {
    const title = getState().library.datasets[id].get('name');
    dispatch(showNotification('info', `Updating "${title}"`));
    api
      .post(
        `/api/datasets/${id}/update`,
        // Send the refreshToken as part of the update request as a workaround
        // for not being able to get an offline token to the backend. It's TBD
        // how we want to do that.
        { refreshToken: auth.refreshToken() }
      )
      .then(response => response.json())
      .then(({ updateId, error }) => {
        if (updateId != null) {
          dispatch(updateDatasetTogglePending(id));
          dispatch(pollDatasetUpdateStatus(updateId, id, title));
        } else {
          dispatch(showNotification('error', `Update failed: ${error}`));
        }
      });
  };
}

/*
 * The reducer is run in the action creator to be able to
 * properly catch exceptions in the case of { onError: 'fail' }
 * See: https://github.com/zalmoxisus/redux-devtools-instrument/issues/5
 */
export function transform(datasetId, transformation) {
  return (dispatch, getState) => {
    const dataset = getState().library.datasets[datasetId];
    try {
      const nextDataset = applyTransformation(dataset, transformation);
      dispatch({
        type: constants.REPLACE_DATASET,
        dataset: nextDataset,
      });
    } catch (e) {
      if (transformation.get('onError') === 'fail') {
        dispatch(showNotification('error', `Transformation aborted: ${e.message}`));
      } else {
        throw e;
      }
    }
  };
}

function transformationLogRequestSent(datasetId) {
  return {
    type: constants.TRANSFORMATION_LOG_REQUEST_SENT,
    datasetId,
  };
}

function transformationSuccess(datasetId) {
  return {
    type: constants.TRANSFORMATION_SUCCESS,
    datasetId,
  };
}

function transformationFailure(datasetId, reason) {
  return {
    type: constants.TRANSFORMATION_FAILURE,
    datasetId,
    reason,
  };
}

function pollDatasetTransformationStatus(jobExecutionId, datasetId) {
  return (dispatch) => {
    api
      .get(`/api/job_executions/${jobExecutionId}`)
      .then(response => response.json())
      .then(({ status, reason }) => {
        if (status === 'PENDING') {
          setTimeout(
            () => dispatch(pollDatasetTransformationStatus(jobExecutionId, datasetId)),
            constants.POLL_INTERVAL
          );
        } else if (status === 'FAILED') {
          dispatch(transformationFailure(datasetId, reason));
        } else if (status === 'OK') {
          dispatch(transformationSuccess(datasetId));
        }
      })
      .catch(error => dispatch(error));
  };
}

export function sendTransformationLog(datasetId, transformations) {
  return (dispatch) => {
    dispatch(transformationLogRequestSent(datasetId));
    api
      .post(`/api/transformations/${datasetId}`, transformations.toJSON())
      .then(response => response.json())
      .then(({ jobExecutionId }) =>
        dispatch(pollDatasetTransformationStatus(jobExecutionId, datasetId))
      );
  };
}

export function undoTransformation(id) {
  return {
    type: constants.UNDO_TRANSFORMATION,
    id,
  };
}
