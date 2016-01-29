import * as constants from '../constants/dataset';

export function createDataset(dataset) {
  return {
    type: constants.CREATE,
    dataset: Object.assign({}, dataset, {
      id: Math.random() * 1e9 | 0,
    }),
  };
}
