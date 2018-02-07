import * as constants from '../constants/library';

export default function loadStatus(state = null, action) {
  switch (action.type) {
    case constants.FETCH_LIBRARY_FAILURE:
      return 'failed';
    case constants.FETCH_LIBRARY_REQUEST:
      return null;
    default: return state;
  }
}
