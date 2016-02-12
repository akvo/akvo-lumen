import * as constants from '../constants/dataset';
import update from 'react-addons-update';

export const initialState = {
  currentPage: 'select-data-source-type',
  dataset: {
    source: {
      type: 'DATA_FILE',
    },
    name: '',
  },
};

function selectDataSource(state, dataSource) {
  return update(state, {
    dataset: {source: { $set: dataSource }}
  });
}

function nextPage(state) {
  const currentPage = state.currentPage;
  let nextPage = '';
  if (currentPage === 'select-data-source-type') {
    nextPage = 'define-data-source';
  } else if (currentPage === 'define-data-source') {
    nextPage = 'define-dataset';
  } else {
    throw new Error(`No next page for ${currentPage}`);
  }
  return update(state, {
    currentPage: { $set: nextPage }
  });
}

function previousPage(state) {
  const currentPage = state.currentPage;
  let previousPage = '';
  if (currentPage === 'define-dataset') {
    previousPage = 'define-data-source';
  } else if (currentPage === 'define-data-source') {
    previousPage = 'select-data-source-type';
  } else {
    throw new Error(`No previous page for ${currentPage}`);
  }

  return update(state, {currentPage: {$set: previousPage}});
}

function defineDataSource(state, dataSource) {
  return update(state, {
    dataset: {source: {$set: dataSource}}
  })
}

// Only name for now.
function defineDatasetSettings(state, { name }) {
  return update(state, {
    dataset: {name: {$set: name}}
  });
}

export default function dataSources(state = initialState, action) {
  switch (action.type) {
    case constants.SELECT_DATA_SOURCE:
      return selectDataSource(state, action.dataSource);
    case constants.NEXT_PAGE:
      return nextPage(state);
    case constants.PREVIOUS_PAGE:
      return previousPage(state);
    case constants.DEFINE_DATA_SOURCE:
      return defineDataSource(state, action.dataSource);
    case constants.DEFINE_DATASET_SETTINGS:
      return defineDatasetSettings(state, action.dataset);
    case constants.CREATE_DATA_SOURCE_REQUEST:
      return createDataSourceRequest(state, action.fetchId);
    case constants.CREATE_DATA_SOURCE_FAILURE:
      return createDataSourceFailure(state, action.fetchId);
    case constants.CREATE_DATA_SOURCE_SUCCESS:
      return createDataSourceSuccess(state, action.fetchId, action.importId);
    default: return state;
  }
}
