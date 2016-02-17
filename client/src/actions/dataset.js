import * as constants from '../constants/dataset';

function fetchDatasetRequest(id) {
  return {
    type: constants.FETCH_DATASET_REQUEST,
    id,
  };
}

const pollInteval = 1000;
function fetchDatasetSuccess(dataset) {
  return (dispatch) => {
    if (dataset.state === 'PENDING') {
      /* eslint-disable no-use-before-define */
      setTimeout(() => fetchDataset(dataset.id), pollInteval);
      /* esllint-enable no-use-before-define */
    }
    dispatch({
      type: constants.FETCH_DATASET_SUCCESS,
      dataset,
    });
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
    fetch(`/api/datasets/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.json())
    .then(dataset => dispatch(fetchDatasetSuccess(dataset)))
    .catch(error => dispatch(fetchDatasetFailure(error, id)));
  };
}


function createDatasetRequest(dataset) {
  return {
    type: constants.CREATE_DATASET_REQUEST,
    dataset,
  };
}

function createDatasetSuccess(dataset) {
  return (dispatch) => {
    dispatch({
      type: constants.CREATE_DATASET_SUCCESS,
      dataset,
    });
    dispatch(fetchDataset(dataset.id));
  };
}

function createDatasetFailure(error, dataset) {
  return {
    type: constants.CREATE_DATASET_FAILURE,
    dataset,
  };
}

export function createDataset(dataset) {
  return (dispatch) => {
    dispatch(createDatasetRequest(dataset));
    fetch('/api/datasets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataset),
    })
    .then(response => response.json())
    .then(ds => dispatch(createDatasetSuccess(ds)))
    .catch(error => dispatch(createDatasetFailure(error, dataset)));
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
