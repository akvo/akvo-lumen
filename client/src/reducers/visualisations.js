import * as constants from '../constants/visualisation';

export const initialState = {
  102: {
    id: 102,
    name: 'visualisation 1',
    type: 'visualisation',
    created: '1449873058414',
  },
  104: {
    id: 104,
    name: 'visualisation 2',
    type: 'visualisation',
    created: '1448146165194',
    modified: '1469109685570',

  },
  109: {
    id: 109,
    name: 'visualisation 3',
    type: 'visualisation',
    created: '1449873058411',
  },
};

function createVisualisation(state, visualisationData) {
  const id = visualisationData.id;
  return Object.assign({}, state, {
    [id]: visualisationData,
  });
}

function editVisualisation(state, visualisationData) {
  const id = visualisationData.id;
  return Object.assign({}, state, {
    [id]: visualisationData,
  });
}

export default function visualisation(state = initialState, action) {
  switch (action.type) {
    case constants.CREATE:
      return createVisualisation(state, action.visualisation);
    case constants.EDIT:
      return editVisualisation(state, action.visualisation);
    default: return state;
  }
}
