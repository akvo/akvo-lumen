import { handleActions } from 'redux-actions';
import update from 'react-addons-update';
import * as actions from '../actions/collection';

export const initialState = {};

function createCollection(state, { payload }) {
  const id = payload.id;
  return update(state, {
    [id]: { $set: payload },
  });
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
  [actions.createCollectionSuccess]: createCollection,
  [actions.editCollectionSuccess]: editCollection,
  [actions.deleteCollectionSuccess]: removeCollection,
}, initialState);
