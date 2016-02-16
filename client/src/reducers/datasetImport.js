import * as constants from '../constants/dataset';
import update from 'react-addons-update';

export const initialState = {
  currentPage: 'select-data-source-type',
  dataset: {
    source: {
      kind: 'DATA_FILE',
    },
    name: '',
  },
};

function selectDataSource(state, dataSource) {
  return update(state, {
    dataset: { source: { $set: dataSource } },
  });
}

function nextPage(state) {
  const currentPage = state.currentPage;
  let nPage = '';
  if (currentPage === 'select-data-source-type') {
    nPage = 'define-data-source';
  } else if (currentPage === 'define-data-source') {
    nPage = 'define-dataset';
  } else {
    throw new Error(`No next page for ${currentPage}`);
  }
  return update(state, {
    currentPage: { $set: nPage },
  });
}

function previousPage(state) {
  const currentPage = state.currentPage;
  let prevPage = '';
  if (currentPage === 'define-dataset') {
    prevPage = 'define-data-source';
  } else if (currentPage === 'define-data-source') {
    prevPage = 'select-data-source-type';
  } else {
    throw new Error(`No previous page for ${currentPage}`);
  }
  return update(state, {
    currentPage: { $set: prevPage },
  });
}

function defineDataSource(state, dataSource) {
  return update(state, {
    dataset: { source: { $set: dataSource } },
  });
}

// Only name for now.
function defineDatasetSettings(state, { name }) {
  return update(state, {
    dataset: { name: { $set: name } },
  });
}

export default function datasetImport(state = initialState, action) {
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
    default: return state;
  }
}
