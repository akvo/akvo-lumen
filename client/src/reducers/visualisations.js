import { handleActions } from 'redux-actions';
import update from 'react-addons-update';
import * as actions from '../actions/visualisation';

export const initialState = {};

function createVisualisation(state, { payload }) {
  const id = payload.id;
  return update(state, {
    [id]: { $set: payload },
  });
}

function editVisualisation(state, { payload }) {
  const id = payload.id;
  return Object.assign({}, state, {
    [id]: payload,
  });
}

function saveVisualisations(state, { payload }) {
  // TODO we should probably not overwrite?
  return payload.reduce((result, vis) => {
    const id = vis.id;
    return update(result, {
      [id]: { $set: update(vis, { $merge: { type: 'visualisation', status: 'OK' } }) },
    });
  }, state);
}

function saveVisualisation(state, { payload }) {
  const id = payload.id;
  const spec = payload.spec;
  const existingVis = state[id];
  if (existingVis == null) {
    return Object.assign({}, state, {
      [id]: Object.assign({}, payload, { type: 'visualisation', status: 'OK' }),
    });
  }
  return update(state, {
    [id]: {
      $set: update(existingVis, { $merge: spec }),
    },
  });
}

function saveShareId(state, { payload }) {
  const id = payload.id;
  return {
    ...state,
    [id]: { ...state[id], ...payload },
  };
}

function removeVisualisation(state, { payload }) {
  const newState = Object.assign({}, state);
  delete newState[payload];
  return newState;
}

export default handleActions({
  [actions.createVisualisationSuccess]: createVisualisation,
  [actions.fetchVisualisationsSuccess]: saveVisualisations,
  [actions.fetchVisualisationSuccess]: saveVisualisation,
  [actions.saveVisualisationChangesSuccess]: editVisualisation,
  [actions.deleteVisualisationSuccess]: removeVisualisation,
  [actions.fetchShareIdSuccess]: saveShareId,
}, initialState);
