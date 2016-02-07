import * as constants from '../constants/visualisation';

export function createVisualisation(visualisation) {
  const now = Date.now();

  return {
    type: constants.CREATE,
    visualisation: Object.assign({}, visualisation, {
      id: Math.random() * 1e9 | 0,
      created: now,
      modified: now,
    }),
  };
}

export function saveVisualisationChanges(visualisation) {
  const now = Date.now();

  return {
    type: constants.EDIT,
    visualisation: Object.assign({}, visualisation, {
      modified: now,
    }),
  };
}
