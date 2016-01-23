import * as constants from '../constants/library';

const initialState = {
  datasets: {},
  visualisations: {},
  dashboards: {},
  sortOrder: 'LAST_MODIFIED',
  displayMode: 'LIST',
  filterBy: 'ALL',
  searchString: '',
};

export default function library(state = initialState, action) {
  switch (action.type) {
    case constants.CHANGE_SORT_ORDER:
      return Object.assign({}, state, { sortOrder: action.sortOrder });
    case constants.CHANGE_DISPLAY_MODE:
      return Object.assign({}, state, { displayMode: action.displayMode });
    case constants.CHANGE_FILTER_BY:
      return Object.assign({}, state, { filterBy: action.filterBy });
    case constants.SET_SEARCH_STRING:
      return Object.assign({}, state, { searchString: action.searchString });
    default: return state;
  }
}
