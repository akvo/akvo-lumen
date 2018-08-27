import { createAction } from 'redux-actions';
import { push } from 'react-router-redux';
import { saveAs } from 'file-saver/FileSaver';

import { fetchDataset } from './dataset';
import { showNotification } from './notification';
import * as dashboardActions from './dashboard';
import { addEntitiesToCollection } from './collection';
import * as api from '../api';
import { base64ToBlob, extToContentType } from '../utilities/export';

/* Fetched all visualisations */
export const fetchVisualisationsSuccess = createAction('FETCH_VISUALISATIONS_SUCCESS');

/* Create a new visualisation */
export const createVisualisationRequest = createAction('CREATE_VISUALISATION_REQUEST');
export const createVisualisationSuccess = createAction('CREATE_VISUALISATION_SUCCESS');
export const createVisualisationFailure = createAction('CREATE_VISUALISATION_FAILURE');

export function createVisualisation(visualisation, collectionId, callback = () => {}) {
  return (dispatch) => {
    dispatch(createVisualisationRequest(visualisation));
    api
      .post('/api/visualisations', visualisation)
      .then(response => response.json())
      .then((vis) => {
        dispatch(createVisualisationSuccess(vis));
        if (collectionId) {
          dispatch(addEntitiesToCollection(vis.id, collectionId));
        }
        dispatch(push(`/visualisation/${vis.id}`));
        callback();
      })
      .catch((err) => {
        dispatch(createVisualisationFailure(err));
        callback(err);
      });
  };
}

/* Fetch a single visualisation */
export const fetchVisualisationRequest = createAction('FETCH_VISUALISATION_REQUEST');
export const fetchVisualisationSuccess = createAction('FETCH_VISUALISATION_SUCCESS');
export const fetchVisualisationFailure = createAction('FETCH_VISUALISATION_FAILURE');

export function fetchVisualisation(id) {
  return (dispatch) => {
    dispatch(fetchVisualisationRequest(id));
    api
      .get(`/api/visualisations/${id}`)
      .then(response => response.json())
      .then((visualisation) => {
        // We also need to possibly fetch datasets.
        const datasetId = visualisation.datasetId;
        if (datasetId) {
          dispatch(fetchDataset(datasetId, true));
        }
        // ...which might be stored on layers if it's a map
        if (visualisation.visualisationType === 'map') {
          const { spec } = visualisation;

          if (spec.layers && spec.layers.length) {
            const { layers } = spec;
            const datasetsToLoad = [];

            layers.forEach((layer) => {
              if (layer.datasetId) {
                datasetsToLoad.push(layer.datasetId);
              }
              if (layer.aggregationDataset) {
                datasetsToLoad.push(layer.aggregationDataset);
              }
            });

            datasetsToLoad.forEach(depId => dispatch(fetchDataset(depId, true)));
          }
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

export function saveVisualisationChanges(visualisation, callback = () => {}) {
  return (dispatch, getState) => {
    const prevVisualisation = getState().library.visualisations[visualisation.id];
    dispatch(
      saveVisualisationChangesRequest(
        Object.assign({}, visualisation, {
          modified: Date.now(),
          status: 'PENDING',
        })
      )
    );
    api
      .put(`/api/visualisations/${visualisation.id}`, visualisation)
      .then(response => response.json())
      .then(() => {
        dispatch(
          saveVisualisationChangesSuccess(
            Object.assign({}, visualisation, {
              modified: Date.now(),
              status: 'OK',
            })
          )
        );
        callback();
      })
      .catch((error) => {
        dispatch(saveVisualisationChangesFailure(prevVisualisation));
        callback(error);
      });
  };
}

/* Delete visualisation actions */
export const deleteVisualisationRequest = createAction('DELETE_VISUALISATION_REQUEST');
export const deleteVisualisationFailure = createAction('DELETE_VISUALISATION_FAILURE');
export const deleteVisualisationSuccess = createAction('DELETE_VISUALISATION_SUCCESS');

/* Remove visualisation from library */
export function removeVisualisation(id) {
  return (dispatch) => {
    dispatch(deleteVisualisationSuccess(id));
    dispatch(dashboardActions.removeVisualisation(id));
  };
}

export function deleteVisualisation(id) {
  return (dispatch) => {
    dispatch(deleteVisualisationRequest(id));
    api
      .del(`/api/visualisations/${id}`)
      .then(response => response.json())
      .then(() => dispatch(removeVisualisation(id)))
      .catch(error => dispatch(deleteVisualisationFailure(error)));
  };
}

/* Fetch visualisation share id */
export const fetchShareIdRequest = createAction('FETCH_VISUALISATION_SHARE_ID_REQUEST');
export const fetchShareIdFailure = createAction('FETCH_VISUALISATION_SHARE_ID_FAILURE');
export const fetchShareIdSuccess = createAction('FETCH_VISUALISATION_SHARE_ID_SUCCESS');

export function fetchShareId(visualisationId) {
  return (dispatch) => {
    if (visualisationId != null) {
      api
        .post('/api/shares', { visualisationId })
        .then(response => response.json())
        .then((response) => {
          dispatch(fetchShareIdSuccess({ id: visualisationId, shareId: response.id }));
        });
    }
  };
}

/* Export visualisation */
export const exportVisualisationRequest = createAction('EXPORT_VISUALISATION_REQUEST');
export const exportVisualisationSuccess = createAction('EXPORT_VISUALISATION_SUCCESS');
export const exportVisualisationFailure = createAction('EXPORT_VISUALISATION_FAILURE');

export function exportVisualisation(visualisationId, options) {
  const { format, title } = { format: 'png', title: 'Untitled Export', ...options };
  return (dispatch) => {
    dispatch(exportVisualisationRequest({ id: visualisationId }));

    if (visualisationId === null) throw new Error('visualisationId not set');

    const target = `${window.location.origin}/visualisation/${visualisationId}/export`;
    return api
      .post(`/api/visualisations/${visualisationId}/export`, {
        format,
        title,
        selector: `.render-completed-${visualisationId}`,
        target,
        clip: {
          x: 0,
          y: 0,
          width: 1000,
          height: 600,
        },
      })
      .then((response) => {
        if (response.status !== 200) {
          dispatch(showNotification('error', 'Failed to export visualisation.'));
          dispatch(exportVisualisationFailure({ id: visualisationId }));
          return;
        }
        response.text().then((imageStr) => {
          const blob = base64ToBlob(imageStr, extToContentType(format));
          saveAs(blob, `${title}.${format}`);
          dispatch(exportVisualisationSuccess({ id: visualisationId }));
        });
      })
      .catch((error) => {
        dispatch(exportVisualisationFailure(error));
      });
  };
}
