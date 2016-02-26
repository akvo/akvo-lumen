import * as constants from '../constants/visualisation';
import { fetchDataset } from './dataset';
import fetch from 'isomorphic-fetch';

export function fetchVisualisationsSuccess(visualisations) {
  return {
    type: constants.FETCH_VISUALISATIONS_SUCCESS,
    visualisations,
  };
}

function createVisualisationSuccess(visualisation) {
  return {
    type: constants.CREATE_VISUALISATION_SUCCESS,
    visualisation,
  };
}

function createVisualisationFailure() {
  return {
    type: constants.CREATE_VISUALISATION_FAILURE,
  };
}

function createVisualisationRequest(visualisation) {
  return (dispatch) => {
    dispatch({
      type: constants.CREATE_VISUALISATION_REQUEST,
      visualisation,
    });
    fetch('/api/visualisations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: visualisation.name,
        spec: visualisation,
      }),
    })
    .then(response => response.json())
    .then(vis => dispatch(createVisualisationSuccess(vis)))
    .catch(err => dispatch(createVisualisationFailure(err)));
  };
}


export function createVisualisation(visualisation) {
  return createVisualisationRequest(visualisation);
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

function fetchVisualisationSuccess(visualisation) {
  return (dispatch) => {
    // We also need to possibly fetch datasets.
    const datasetXId = visualisation.spec.sourceDatasetX;
    const datasetYId = visualisation.spec.sourceDatasetY;

    if (datasetXId) {
      dispatch(fetchDataset(datasetXId));
    }

    if (datasetYId) {
      dispatch(fetchDataset(datasetYId));
    }

    dispatch({
      type: constants.FETCH_VISUALISATION_SUCCESS,
      visualisation,
    });
  };
}

function fetchVisualisationFailure(id) {
  return {
    type: constants.FETCH_VISUALISATION_FAILURE,
    id,
  };
}

function fetchVisualisationRequest(id) {
  return {
    type: constants.FETCH_VISUALISATION_REQUEST,
    id,
  };
}

export function fetchVisualisation(id) {
  return (dispatch) => {
    dispatch(fetchVisualisationRequest(id));
    fetch(`/api/visualisations/${id}`)
    .then(response => response.json())
    .then(visualisation => dispatch(fetchVisualisationSuccess(visualisation)))
    .catch(err => dispatch(fetchVisualisationFailure(id, err)));
  };
}
