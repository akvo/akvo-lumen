import * as constants from '../constants/dataset';

export function createDataset(dataset) {
  const now = Date.now();

  return {
    type: constants.CREATE,
    dataset: Object.assign({}, dataset, {
      id: Math.random() * 1e9 | 0,
      type: 'dataset',
      created: now,
      modified: now,
    }),
  };
}
