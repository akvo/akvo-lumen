import { createAction } from 'redux-actions';
import { push } from 'react-router-redux';
import { fetchDataset } from './dataset';
import * as api from '../utilities/api';

/* Fetched all visualisations */
export const fetchVisualisationsSuccess = createAction('FETCH_VISUALISATIONS_SUCCESS');

/* Create a new visualisation */
export const createVisualisationRequest = createAction('CREATE_VISUALISATION_REQUEST');
export const createVisualisationSuccess = createAction('CREATE_VISUALISATION_SUCCESS');
export const createVisualisationFailure = createAction('CREATE_VISUALISATION_FAILURE');

export function createVisualisation(visualisation) {
  return (dispatch) => {
    dispatch(createVisualisationRequest(visualisation));
    api.post('/api/visualisations', visualisation)
      .then(response => response.json())
      .then((vis) => {
        dispatch(createVisualisationSuccess(vis));
        dispatch(push(`/visualisation/${vis.id}`));
      })
      .catch(err => dispatch(createVisualisationFailure(err)));
  };
}

/* Fetch a single visualisation */
export const fetchVisualisationRequest = createAction('FETCH_VISUALISATION_REQUEST');
export const fetchVisualisationSuccess = createAction('FETCH_VISUALISATION_SUCCESS');
export const fetchVisualisationFailure = createAction('FETCH_VISUALISATION_FAILURE');

export function fetchVisualisation(id) {
  return (dispatch) => {
    dispatch(fetchVisualisationRequest(id));
    api.get(`/api/visualisations/${id}`)
      .then(response => response.json())
      .then((visualisation) => {
        // We also need to possibly fetch datasets.
        const datasetId = visualisation.datasetId;
        if (datasetId) {
          dispatch(fetchDataset(datasetId));
        }
        dispatch(fetchVisualisationSuccess(visualisation));
      })
      .catch(err => dispatch(fetchVisualisationFailure(err)));
  };
}

/* Save an existing visualisation */
export const saveVisualisationChangesRequest = createAction('SAVE_VISUALISATION_CHANGES_REQUEST');
export const saveVisualisationChangesFailure = createAction('SAVE_VISUALISATION_CHANGES_FAILURE');
export const saveVisualisationChangesSuccess = createAction('SAVE_VISUALISATION_CHANGES_SUCCESS');

export function saveVisualisationChanges(visualisation) {
  return (dispatch, getState) => {
    const prevVisualisation = getState().library.visualisations[visualisation.id];
    dispatch(saveVisualisationChangesRequest(Object.assign({}, visualisation, {
      modified: Date.now(),
      status: 'PENDING',
    })));
    api.put(`/api/visualisations/${visualisation.id}`, visualisation)
      .then(response => response.json())
      .then(() => dispatch(saveVisualisationChangesSuccess(Object.assign({}, visualisation, {
        modified: Date.now(),
        status: 'OK',
      }))))
      .catch(() => dispatch(saveVisualisationChangesFailure(prevVisualisation)));
  };
}

/* Delete visualisation actions */
export const deleteVisualisationRequest = createAction('DELETE_VISUALISATION_REQUEST');
export const deleteVisualisationFailure = createAction('DELETE_VISUALISATION_FAILURE');
export const deleteVisualisationSuccess = createAction('DELETE_VISUALISATION_SUCCESS');

export function deleteVisualisation(id) {
  return (dispatch) => {
    dispatch(deleteVisualisationRequest);
    api.del(`/api/visualisations/${id}`)
      .then(response => response.json())
      .then(() => dispatch(deleteVisualisationSuccess(id)))
      .catch(error => dispatch(deleteVisualisationFailure(error)));
  };
}
