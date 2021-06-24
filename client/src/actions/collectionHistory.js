import * as constants from '../constants/collectionHistory';


export function updateLocation(location) {
  return {
    type: constants.UPDATE_COLLECTION_HISTORY,
    location,
  };
}


export function updateCollectionLocation(location) {
  return (dispatch) => {
    dispatch(updateLocation(location));
  };
}
