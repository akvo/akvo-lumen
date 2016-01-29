import * as dataset from '../constants/dataset';

export const initialState = {
  datasets: {},
  visualisations: {},
  dashboards: {},
};

export default function library(state = initialState, action) {
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
