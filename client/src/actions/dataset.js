import * as constants from '../constants/dataset';

function createDatasetRequest(dataset) {
  return {
    type: constants.CREATE_DATASET_REQUEST,
    dataset,
  }
}

function createDatasetSuccess(dataset) {
  debugger;
  return {
    type: constants.CREATE_DATASET_SUCCESS,
    dataset,
  }
}

function createDatasetFailure(dataset) {
  debugger;
  return {
    type: constants.CREATE_DATASET_FAILURE,
    dataset,
  }
}

export function createDataset(dataset) {
  return (dispatch, getState) => {
    dispatch(createDatasetRequest(dataset));
    fetch('/api/dataset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataset),
    }).then(response => {
      return response.json();
    }).then(dataset => {
      createDatasetSuccess(dataset)
    }).catch(error => {
      createDatasetFailure(dataset);
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
    dataset: { name }
  }
}

export function selectDataSource(dataSource) {
  return {
    type: constants.SELECT_DATA_SOURCE,
    dataSource,
  }
}

export function nextPage() {
  return {
    type: constants.NEXT_PAGE,
  }
}

export function previousPage() {
  return {
    type: constants.PREVIOUS_PAGE,
  }
}

export function defineDataSource(dataSource) {
  return {
    type: constants.DEFINE_DATA_SOURCE,
    dataSource,
  }
}

function createDataSourceRequest(fetchId) {
  return {
    type: constants.CREATE_DATA_SOURCE_REQUEST,
    fetchId,
  }
}

function createDataSourceSuccess(fetchId, importId) {
  return {
    type: constants.CREATE_DATA_SOURCE_SUCCESS,
    fetchId,
    importId,
  }
}

function createDataSourceFailure(fetchId) {
  return {
    type: constants.CREATE_DATA_SOURCE_FAILURE,
    fetchId,
  }
}

let _fetchId = 0;
function nextFetchId() {
  return _fetchId++;
}

// Poll each second.
const pollingInterval = 1000;

export function createDataSource(dataSource) {
  const fetchId = nextFetchId();
  return (dispatch, getState) => {
    dispatch(createDataSourceRequest(fetchId));
    fetch('/api/datasource', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: dataSource,
    }).then(response => {
      if (response.status !== 200) {
        throw new Error('');
      }
      return response.json();
    }).then(response => {
      dispatch(createDataSourceSuccess(fetchId, response.id));
      // Start polling for when the dataset is available


    }).catch(error => {
      dispatch(createDataSourceFailure(fetchId));
    })
  }
}
