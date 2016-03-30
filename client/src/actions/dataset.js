import * as constants from '../constants/dataset';
import { hideModal } from './activeModal';
import headers from './headers';

function fetchDatasetRequest(id) {
  return {
    type: constants.FETCH_DATASET_REQUEST,
    id,
  };
}

const pollInteval = 1000;
function fetchDatasetSuccess(dataset) {
  return (dispatch) => {
    if (dataset.status === 'PENDING') {
      /* eslint-disable no-use-before-define */
      setTimeout(() => dispatch(fetchDataset(dataset.id)), pollInteval);
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
      headers: headers(),
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
    dispatch(hideModal());
    dispatch(fetchDataset(dataset.id));
  };
}

function createDatasetFailure(error, dataset) {
  return {
    type: constants.CREATE_DATASET_FAILURE,
    dataset,
  };
}

export function clearImport() {
  return {
    type: constants.CLEAR_IMPORT,
  };
}

export function createDataset(dataset) {
  return (dispatch) => {
    dispatch(createDatasetRequest(dataset));
    fetch('/api/datasets', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(dataset),
    })
    .then(response => response.json())
    .then(ds => {
      dispatch(createDatasetSuccess(ds));
      dispatch(clearImport());
    })
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

export function fetchDatasetsSuccess(datasets) {
  return {
    type: constants.FETCH_DATASETS_SUCCESS,
    datasets,
  };
}
