import * as constants from '../constants/dataset';

export const initialState = {};

function createDataset(state, dataset) {
  const id = dataset.get('id');
  return Object.assign({}, state, {
    [id]: dataset,
  });
}

function saveDatasetSettings(state, dataset) {
  const id = dataset.get('id');
  const name = dataset.get('name');
  return Object.assign({}, state, {
    [id]: state[id].set('name', name),
  });
}

function importDatasetPending(state, dataset) {
  const id = dataset.get('id');
  return Object.assign({}, state, {
    [id]: dataset,
  });
}

function importDatasetFailure(state, { importId, reason, modified }) {
  const dataset = {
    status: 'FAILED',
    reason,
    modified,
  };

  return Object.assign({}, state, {
    [importId]: state[importId] ? state[importId].merge(dataset) : dataset,
  });
}

function importDatasetSuccess(state, { importId }) {
  const newState = Object.assign({}, state);
  delete newState[importId];
  return newState;
}

function saveDataset(state, dataset) {
  const id = dataset.get('id');
  return {
    ...state,
    [id]: dataset.set('type', 'dataset').set('fetched', new Date()),
  };
}

function saveDatasets(state, ds) {
  return ds.reduce((result, dataset) => {
    const id = dataset.get('id');
    if (state[id] == null) {
      return Object.assign({}, result, {
        [id]: dataset.set('type', 'dataset').set('fetched', new Date()),
      });
    }
    return result;
  }, state);
}

function updateDatasetSuccess(state, datasetId, data) {
  const dataset = state[datasetId];
  return Object.assign({}, state, {
    [datasetId]: dataset.merge(data).set('fetched', new Date()),
  });
}

function removeDataset(state, id) {
  const newState = Object.assign({}, state);
  delete newState[id];
  return newState;
}

function replaceDataset(state, { dataset }) {
  return Object.assign({}, state, {
    [dataset.get('id')]: dataset,
  });
}

function transformationLogRequestSent(state, { datasetId }) {
  const dataset = state[datasetId];
  return Object.assign({}, state, {
    [datasetId]: dataset.set('status', 'PENDING').delete('history'),
  });
}

function transformationFailure(state, { datasetId, reason }) {
  const dataset = state[datasetId];
  return Object.assign({}, state, {
    [datasetId]: dataset.set('status', 'FAILED').set('reason', reason),
  });
}

function transformationSuccess(state, { datasetId }) {
  const dataset = state[datasetId];
  return Object.assign({}, state, {
    [datasetId]: dataset.set('status', 'OK'),
  });
}

function undoDatasetTransformation(state, id) {
  const dataset = state[id];
  if (dataset.get('history') != null && dataset.get('history').size > 0) {
    return Object.assign({}, {
      [id]: dataset.getIn(['history', 0]),
    });
  }
  return state;
}

function toggleDatasetUpdatePending(state, id) {
  const dataset = state[id];
  const newStatus = dataset.get('status') === 'PENDING' ? 'OK' : 'PENDING';
  return Object.assign({}, state, {
    [id]: dataset.setIn(['status'], newStatus),
  });
}

function lockDatasetFromTransformations(state, { payload: { datasetId } }) {
  const dataset = state[datasetId];
  return Object.assign({}, state, {
    [datasetId]: dataset.setIn(['isLockedFromTransformations'], true),
  });
}

function unlockDatasetFromTransformations(state, { payload: { datasetId } }) {
  const dataset = state[datasetId];
  return Object.assign({}, state, {
    [datasetId]: dataset.setIn(['isLockedFromTransformations'], false),
  });
}

export default function datasets(state = initialState, action) {
  switch (action.type) {
    case constants.CREATE:
      return createDataset(state, action.dataset);
    case constants.SAVE_SETTINGS:
      return saveDatasetSettings(state, action.dataset);
    case constants.IMPORT_DATASET_PENDING:
      return importDatasetPending(state, action.dataset);
    case constants.IMPORT_DATASET_FAILURE:
      return importDatasetFailure(state, action);
    case constants.IMPORT_DATASET_SUCCESS:
      return importDatasetSuccess(state, action);
    case constants.FETCH_DATASET_SUCCESS:
      return saveDataset(state, action.dataset);
    case constants.FETCH_DATASETS_SUCCESS:
      return saveDatasets(state, action.datasets);
    case constants.UPDATE_DATASET_META_SUCCESS:
      return updateDatasetSuccess(state, action.id, action.meta);
    case constants.REMOVE_DATASET:
      return removeDataset(state, action.id);
    case constants.REPLACE_DATASET:
      return replaceDataset(state, action);
    case constants.TRANSFORMATION_LOG_REQUEST_SENT:
      return transformationLogRequestSent(state, action);
    case constants.TRANSFORMATION_SUCCESS:
      return transformationSuccess(state, action);
    case constants.TRANSFORMATION_FAILURE:
      return transformationFailure(state, action);
    case constants.UNDO_TRANSFORMATION:
      return undoDatasetTransformation(state, action.id);
    case constants.TOGGLE_DATASET_UPDATE_PENDING:
      return toggleDatasetUpdatePending(state, action.id);
    case constants.TRANSFORMATION_START:
      return lockDatasetFromTransformations(state, action);
    case constants.TRANSFORMATION_END:
      return unlockDatasetFromTransformations(state, action);
    default: return state;
  }
}
