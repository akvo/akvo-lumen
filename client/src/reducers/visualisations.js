import update from 'react-addons-update';
import * as constants from '../constants/visualisation';

export const initialState = {};

function createVisualisation(state, visualisationData) {
  const id = visualisationData.id;
  return update(state, {
    [id]: { $set: visualisationData },
  });
}

function editVisualisation(state, visualisationData) {
  const id = visualisationData.id;
  return Object.assign({}, state, {
    [id]: visualisationData,
  });
}

function saveVisualisations(state, visualisations) {
  // TODO we should probably not overwrite?
  return visualisations.reduce((result, vis) => {
    const id = vis.id;
    return update(result, {
      [id]: { $set: update(vis, { $merge: { type: 'visualisation', status: 'OK' } }) },
    });
  }, state);
}

function saveVisualisation(state, vis) {
  const id = vis.id;
  const spec = vis.spec;
  const existingVis = state[id];
  if (existingVis == null) {
    return Object.assign({}, state, {
      [id]: Object.assign({}, vis, { type: 'visualisation', status: 'OK' }),
    });
  }
  return update(state, {
    [id]: {
      $set: update(existingVis, { $merge: spec }),
    },
  });
}

function removeVisualisation(state, id) {
  const newState = Object.assign({}, state);
  delete newState[id];
  return newState;
}

export default function visualisation(state = initialState, action) {
  switch (action.type) {
    case constants.CREATE_VISUALISATION_SUCCESS:
      return createVisualisation(state, action.visualisation);
    case constants.FETCH_VISUALISATIONS_SUCCESS:
      return saveVisualisations(state, action.visualisations);
    case constants.FETCH_VISUALISATION_SUCCESS:
      return saveVisualisation(state, action.visualisation);
    case constants.EDIT:
      return editVisualisation(state, action.visualisation);
    case constants.REMOVE_VISUALISATION:
      return removeVisualisation(state, action.id);
    default: return state;
  }
}
