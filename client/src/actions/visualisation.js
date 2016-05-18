import * as constants from '../constants/visualisation';
import { fetchDataset } from './dataset';
import fetch from 'isomorphic-fetch';
import headers from './headers';

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
      headers: headers(),
      body: JSON.stringify(visualisation),
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
    const datasetId = visualisation.datasetId;

    if (datasetId) {
      dispatch(fetchDataset(datasetId));
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
    fetch(`/api/visualisations/${id}`, {
      method: 'GET',
      headers: headers(),
    })
    .then(response => response.json())
    .then(visualisation => dispatch(fetchVisualisationSuccess(visualisation)))
    .catch(err => dispatch(fetchVisualisationFailure(id, err)));
  };
}

/* Delete visualisation actions */

function deleteVisualisationRequest(id) {
  return {
    type: constants.DELETE_VISUALISATION_REQUEST,
    id,
  };
}

/* Should only remove the visualisation from the redux store.
   To delete a visualisation use deleteVisualisation istead */
export function removeVisualisation(id) {
  return {
    type: constants.REMOVE_VISUALISATION,
    id,
  };
}

function deleteVisualisationSuccess(id) {
  return removeVisualisation(id);
}

function deleteVisualisationFailure(id, error) {
  return {
    type: constants.DELETE_VISUALISATION_FAILURE,
    id,
    error,
  };
}

export function deleteVisualisation(id) {
  return (dispatch) => {
    dispatch(deleteVisualisationRequest);
    fetch(`/api/visualisations/${id}`, {
      method: 'DELETE',
      headers: headers(),
    })
    .then(response => response.json())
    .then(() => dispatch(deleteVisualisationSuccess(id)))
    .catch(error => dispatch(deleteVisualisationFailure(id, error)));
  };
}
