import { createAction } from 'redux-actions';
import { uniq } from 'lodash';

import { hideModal } from './activeModal';
import { showNotification } from './notification';
import * as api from '../utilities/api';

/* Fetched all collections */
export const fetchCollectionsSuccess = createAction('FETCH_COLLECTIONS_SUCCESS');

/* Create a new Collection */
export const createCollectionRequest = createAction('CREATE_COLLECTION_REQUEST');
export const createCollectionSuccess = createAction('CREATE_COLLECTION_SUCCESS');
export const createCollectionFailure = createAction('CREATE_COLLECTION_FAILURE');

/* Edit an existing collection */
export const editCollectionRequest = createAction('EDIT_COLLECTION_REQUEST');
export const editCollectionFailure = createAction('EDIT_COLLECTION_FAILURE');
export const editCollectionSuccess = createAction('EDIT_COLLECTION_SUCCESS');

export function editCollection(collection) {
  const id = collection.id;

  return (dispatch) => {
    dispatch(editCollectionRequest);
    api.put(`/api/collections/${id}`, collection)
      .then(({ body }) => dispatch(editCollectionSuccess(body)))
      .catch((error) => {
        dispatch(showNotification('error', 'Failed to edit collection.'));
        dispatch(editCollectionFailure(error));
      });
  };
}

/* Create a new collection. Optionally include entities to put in the new collection */
export function createCollection(title, optionalEntities) {
  return (dispatch) => {
    // dispatch(createCollectionRequest(title));
    api.post('/api/collections', { title })
      .then(({ body }) => {
        const collection = body;
        dispatch(createCollectionSuccess(collection));
        if (optionalEntities) {
          const collectionWithEntities = { id: collection.id, ...optionalEntities };
          dispatch(editCollection(collectionWithEntities));
        }
        dispatch(hideModal());
      })
      .catch((error) => {
        dispatch(showNotification('error', 'Failed to create collection.'));
        dispatch(createCollectionFailure(error));
      });
  };
}

/* Delete collection actions */
export const deleteCollectionRequest = createAction('DELETE_COLLECTION_REQUEST');
export const deleteCollectionFailure = createAction('DELETE_COLLECTION_FAILURE');
export const deleteCollectionSuccess = createAction('DELETE_COLLECTION_SUCCESS');

export function deleteCollection(id) {
  return (dispatch) => {
    dispatch(deleteCollectionRequest);
    api.del(`/api/collections/${id}`)
      .then(() => dispatch(deleteCollectionSuccess(id)))
      .catch((error) => {
        dispatch(showNotification('error', 'Failed to delete collection.'));
        dispatch(deleteCollectionFailure(error));
      });
  };
}

export function addEntitiesToCollection(entityIds, collectionId) {
  return (dispatch, getState) => {
    const collection = getState().library.collections[collectionId];
    const visualisations = uniq([...entityIds.visualisations, ...collection.visualisations]);
    const dashboards = uniq([...entityIds.dashboards, ...collection.dashboards]);
    const rasters = uniq([...entityIds.rasters, ...collection.rasters]);
    const datasets = uniq([...entityIds.datasets, ...collection.datasets]);
    const entities = { visualisations, dashboards, rasters, datasets };
    const newCollection = { ...collection, ...entities };
    dispatch(editCollection(newCollection));
    dispatch(showNotification('info', `Added to ${collection.title}`, true));
  };
}

export function removeEntitiesFromCollection(entityIds, collectionId) {
  return (dispatch, getState) => {
    const c = getState().library.collections[collectionId];
    const dicts = { visualisations: new Set(entityIds.visualisations),
      dashboards: new Set(entityIds.dashboards),
      rasters: new Set(entityIds.rasters),
      datasets: new Set(entityIds.datasets) };
    const visualisations = c.visualisations.filter(o => dicts.visualisations.has(o) === false);
    const dashboards = c.dashboards.filter(o => dicts.dashboards.has(o) === false);
    const rasters = c.rasters.filter(o => dicts.rastes.has(o) === false);
    const datasets = c.datasets.filter(o => dicts.datasets.has(o) === false);
    const entities = { visualisations, dashboards, rasters, datasets };
    const newCollection = { ...c, ...entities };
    dispatch(editCollection(newCollection));
    dispatch(showNotification('info', `Removed from ${c.title}`, true));
  };
}


export function addTemporaryEntitiesToCollection(entityIds, collectionId) {
  return (dispatch, getState) => {
    const collection = getState().library.collections[collectionId];

    // Convenience conversion so that "entityIds" can be a naked single ID
    const newEntities = Array.isArray(entityIds) ? entityIds : [entityIds];
    const oldEntities = collection.entities || [];

    const updatedEntityArray = oldEntities.slice(0);

    // Add any new entities that are not already in the collection
    newEntities.forEach((newEntity) => {
      if (oldEntities.every(oldEntity => oldEntity !== newEntity)) {
        updatedEntityArray.push(newEntity);
      }
    });

    const newCollection = { ...collection, entities: updatedEntityArray };
    dispatch(editCollectionSuccess(newCollection));
  };
}

export function removeTemporaryEntitiesFromCollection(entityIds, collectionId) {
  return (dispatch, getState) => {
    const collection = getState().library.collections[collectionId];

    if (!collection) return;

    const newCollection = { ...collection };

    if (Array.isArray(entityIds)) {
      entityIds.forEach((entityId) => {
        newCollection.entities = newCollection.entities.filter(id => id !== entityId);
      });
    } else {
      newCollection.entities = newCollection.entities.filter(id => id !== entityIds);
    }

    dispatch(editCollectionSuccess(newCollection));
  };
}
