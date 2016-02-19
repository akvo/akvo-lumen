import * as constants from '../constants/dataset';
import update from 'react-addons-update';

export const initialState = {
  101: {
    id: 101,
    name: 'dataset 1',
    type: 'dataset',
    created: '1449108685570',
    modified: '1459109685570',
    source: {
      type: 'LINK',
      url: 'http://www.example.com/example.csv',
    },
  },
  105: {
    id: 105,
    name: 'dataset 2',
    type: 'dataset',
    created: '1430489504345',
    source: {
      type: 'LINK',
      url: 'http://www.example.com/example.csv',
    },
  },
  110: {
    id: 110,
    name: 'dataset 3',
    type: 'dataset',
    created: '1453895504081',
    modified: '1459229685570',
    source: {
      type: 'LINK',
      url: 'http://www.example.com/example.csv',
    },
  },
};

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

function saveDataset(state, dataset) {
  const id = dataset.id;
  const ds = update(dataset, { $merge: { type: 'dataset' } });
  return update(state, {
    [id]: { $set: ds },
  });
}

function saveDatasets(state) {
  // TODO
  return state;
}

export default function datasets(state = initialState, action) {
  switch (action.type) {
    case constants.CREATE:
      return createDataset(state, action.dataset);
    case constants.SAVE_SETTINGS:
      return saveDatasetSettings(state, action.dataset);
    case constants.FETCH_DATASET_SUCCESS:
      return saveDataset(state, action.dataset);
    case constants.FETCH_DATASETS_SUCCESS:
      return saveDatasets(state, action.datasets);
    default: return state;
  }
}
