import { handleActions } from 'redux-actions';
import update from 'immutability-helper';
import * as actions from '../actions/collection';

export const initialState = null;

function createCollection(state, { payload }) {
  const initiatedState = state || {};
  const id = payload.id;
  return update(initiatedState, {
    [id]: { $set: payload },
  });
}

function saveCollections(state, { payload }) {
  const initiatedState = state || {};

  return payload.reduce((result, collection) => {
    const id = collection.id;
    return update(result, {
      [id]: { $set: update(collection, { $merge: { type: 'collection' } }) },
    });
  }, initiatedState);
}

function editCollection(state, { payload }) {
  const id = payload.id;
  return Object.assign({}, state, {
    [id]: payload,
  });
}

function removeCollection(state, { payload }) {
  const newState = Object.assign({}, state);
  delete newState[payload];
  return newState;
}

export default handleActions({
  [actions.fetchCollectionsSuccess]: saveCollections,
  [actions.createCollectionSuccess]: createCollection,
  [actions.editCollectionSuccess]: editCollection,
  [actions.deleteCollectionSuccess]: removeCollection,
}, initialState);
