import Immutable from 'immutable';
import * as constants from '../constants/dataset';
import * as visualisationActions from './visualisation';
import { hideModal } from './activeModal';
import applyTransformation from '../reducers/transform';
import { showNotification } from './notification';
import * as api from '../api';
import * as auth from '../auth';

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

export function fetchDataset(id) {
  return (dispatch) => {
    dispatch(fetchDatasetRequest(id));
    return api.get(`/api/datasets/${id}`)
      .then(response => response.json())
      .then(dataset => dispatch(fetchDatasetSuccess(Immutable.fromJS(dataset))))
      .catch(error => dispatch(fetchDatasetFailure(error, id)));
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

function importDatasetSuccess(datasetId, importId) {
  return (dispatch) => {
    dispatch(fetchDataset(datasetId));
    dispatch({
      type: constants.IMPORT_DATASET_SUCCESS,
      datasetId,
      importId,
    });
  };
}

const POLL_INTERVAL = 1000;
function pollDatasetImportStatus(importId, name) {
  return (dispatch) => {
    dispatch(importDatasetPending(importId, name));
    api.get(`/api/job_executions/${importId}`)
      .then(response => response.json())
      .then(({ status, reason, datasetId }) => {
        if (status === 'PENDING') {
          setTimeout(() => dispatch(pollDatasetImportStatus(importId, name)), POLL_INTERVAL);
        } else if (status === 'FAILED') {
          dispatch(importDatasetFailure(importId, reason));
        } else if (status === 'OK') {
          dispatch(importDatasetSuccess(datasetId, importId));
        }
      })
      .catch(error => dispatch(error));
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

export function importDataset(dataSource) {
  return (dispatch) => {
    dispatch(importDatasetRequest(dataSource));
    api.post('/api/datasets', dataSource)
      .then(response => response.json())
      .then(({ importId }) => {
        dispatch(pollDatasetImportStatus(importId, dataSource.name));
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
        dispatch(visualisationActions.deleteVisualisationSuccess(visualisationId));
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
    api.del(`/api/datasets/${id}`)
      .then(response => response.json())
      .then(() => dispatch(deleteDatasetSuccess(id)))
      .catch(error => dispatch(deleteDatasetFailure(id, error)));
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
    api.get(`/api/job_executions/${updateId}`)
      .then(response => response.json())
      .then(({ status, reason }) => {
        if (status === 'PENDING') {
          setTimeout(
            () => dispatch(pollDatasetUpdateStatus(updateId, datasetId, title)),
            POLL_INTERVAL
          );
        } else if (status === 'FAILED') {
          dispatch(updateDatasetTogglePending(datasetId));
          dispatch(showNotification('error', `Failed to update "${title}": ${reason}`));
        } else if (status === 'OK') {
          dispatch(fetchDataset(datasetId))
            .then(() => dispatch(showNotification('info', `Successfully updated "${title}"`, true)));
        }
      })
      .catch(error => dispatch(error));
  };
}

export function updateDataset(id) {
  return (dispatch, getState) => {
    const title = getState().library.datasets[id].get('name');
    dispatch(showNotification('info', `Updating "${title}"`));
    dispatch(updateDatasetTogglePending(id));
    api.post(`/api/datasets/${id}/update`,
      // Send the refreshToken as part of the update request as a workaround
      // for not being able to get an offline token to the backend. It's TBD
      // how we want to do that.
      { refreshToken: auth.refreshToken() }
    )
      .then(response => response.json())
      .then(({ updateId }) => {
        dispatch(pollDatasetUpdateStatus(updateId, id, title));
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
    api.get(`/api/job_executions/${jobExecutionId}`)
      .then(response => response.json())
      .then(({ status, reason }) => {
        if (status === 'PENDING') {
          setTimeout(() =>
            dispatch(pollDatasetTransformationStatus(jobExecutionId, datasetId)), POLL_INTERVAL);
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
    api.post(`/api/transformations/${datasetId}`, transformations.toJSON())
      .then(response => response.json())
      .then(({ jobExecutionId }) =>
        dispatch(pollDatasetTransformationStatus(jobExecutionId, datasetId)));
  };
}


export function undoTransformation(id) {
  return {
    type: constants.UNDO_TRANSFORMATION,
    id,
  };
}
