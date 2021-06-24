import * as constants from '../constants/collectionHistory';

export const initialState = {
  location: '',
};

function updateLocationAddress(state, action) {
  const { location } = action;
  return Object.assign({}, state, {
    location,
  });
}

export default function profile(state = initialState, action) {
  switch (action.type) {
    case constants.UPDATE_COLLECTION_HISTORY:
      return updateLocationAddress(state, action);
    default: return state;
  }
}
