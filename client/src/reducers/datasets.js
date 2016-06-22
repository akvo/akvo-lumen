import * as constants from '../constants/dataset';

export const initialState = {};

function createDataset(state, dataset) {
  const id = dataset.id;
  return Object.assign({}, state, {
    [id]: dataset,
  });
}

function saveDatasetSettings(state, dataset) {
  const { id, name } = dataset;
  return Object.assign({}, state, {
    [id]: Object.assign({}, state[id], {
      name,
    }),
  });
}

function importDatasetPending(state, dataset) {
  const id = dataset.id;
  return Object.assign({}, state, {
    [id]: dataset,
  });
}

function importDatasetFailure(state, { importId, reason, modified }) {
  const dataset = Object.assign({}, state[importId], {
    status: 'FAILED',
    reason,
    modified,
  });
  return Object.assign({}, state, {
    [importId]: dataset,
  });
}

function importDatasetSuccess(state, { importId }) {
  const newState = Object.assign({}, state);
  delete newState[importId];
  return newState;
}

function saveDataset(state, dataset) {
  const id = dataset.get('id');
  return Object.assign({}, state, {
    [id]: dataset.set('type', 'dataset'),
  });
}

function saveDatasets(state, ds) {
  return ds.reduce((result, dataset) => {
    const id = dataset.get('id');
    if (state[id] == null) {
      return Object.assign({}, result, {
        [id]: dataset.set('type', 'dataset'),
      });
    }
    return result;
  }, state);
}

function removeDataset(state, id) {
  const newState = Object.assign({}, state);
  delete newState[id];
  return newState;
}

function replaceDataset(state, { dataset }) {
  return Object.assign({}, state, {
    [dataset.id]: dataset,
  });
}

function transformationLogRequestSent(state, { datasetId }) {
  const newDataset = Object.assign({}, state[datasetId], { status: 'PENDING' });
  // Remove history, we don't need it anymore
  delete newDataset.history;
  return Object.assign({}, state, {
    [datasetId]: newDataset,
  });
}

function transformationFailure(state, { datasetId, reason }) {
  return Object.assign({}, state, {
    [datasetId]: Object.assign({}, state[datasetId], {
      status: 'FAILED',
      reason,
    }),
  });
}

function transformationSuccess(state, { datasetId }) {
  return Object.assign({}, state, {
    [datasetId]: Object.assign({}, state[datasetId], {
      status: 'OK',
    }),
  });
}

function undoDatasetTransformation(state, id) {
  const dataset = state[id];
  if (dataset.history != null && dataset.history.length > 0) {
    return Object.assign({}, {
      [id]: dataset.history[0],
    });
  }
  return state;
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
    default: return state;
  }
}
