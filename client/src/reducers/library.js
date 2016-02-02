import * as dataset from '../constants/dataset';

const mockData = {
  datasets: {
    101: {
      name: 'dataset 1',
      type: 'dataset',
      created: '1449108685570',
      modified: '1459109685570',
    },
    105: {
      name: 'dataset 2',
      type: 'dataset',
      created: '1430489504345',
    },
    110: {
      name: 'dataset 3',
      type: 'dataset',
      created: '1453895504081',
      modified: '1459229685570',

    },
  },
  visualisations: {
    102: {
      name: 'visualisation 1',
      type: 'visualisation',
      created: '1449873058414',
    },
    104: {
      name: 'visualisation 2',
      type: 'visualisation',
      created: '1448146165194',
      modified: '1469109685570',

    },
    109: {
      name: 'visualisation 3',
      type: 'visualisation',
      created: '1449873058411',
    },
  },
  dashboards: {
    111: {
      name: 'dashboard 1',
      type: 'visualisation',
      created: '1451733263303',
    },
    115: {
      name: 'dashboard 2',
      type: 'visualisation',
      created: '1453144612699',
    },
    121: {
      name: 'dashboard 3',
      type: 'visualisation',
      created: '1449108685770',
      modified: '1482909685570',

    },
  },
};

export const initialState = {
  datasets: [],
  visualisations: [],
  dashboards: [],
};

export default function library(state = mockData, action) {
  switch (action.type) {
    case dataset.CREATE:
      const id = action.dataset.id;
      return Object.assign({}, state, {
        datasets: Object.assign({}, state.datasets, {
          [id]: action.dataset,
        }),
      });
    default: return state;
  }
}
