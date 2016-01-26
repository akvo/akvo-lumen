export const initialState = {
  datasets: {},
  visualisations: {},
  dashboards: {},
};

export default function library(state = initialState, action) {
  switch (action.type) {
    default: return state;
  }
}
