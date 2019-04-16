import { createAction } from 'redux-actions';
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
          const collectionWithEntities =
            Object.assign({}, collection, { entities: optionalEntities });
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

    const newCollection = Object.assign({}, collection, { entities: updatedEntityArray });
    dispatch(editCollection(newCollection));

    // Show a notification because there is no other visual feedback on adding item to collection
    dispatch(showNotification('info', `Added to ${collection.title}`, true));
  };
}

export function addTemporaryEntitiesToCollection(importId, collectionId) {
  return (dispatch, getState) => {
    const collection = getState().library.collections[collectionId];

    // Convenience conversion so that "entityIds" can be a naked single ID
    const newEntities = [importId];
    const oldEntities = collection.entities || [];

    const updatedEntityArray = oldEntities.slice(0);

    // Add any new entities that are not already in the collection
    newEntities.forEach((newEntity) => {
      if (oldEntities.every(oldEntity => oldEntity !== newEntity)) {
        updatedEntityArray.push(newEntity);
      }
    });

    const newCollection = Object.assign({}, collection, { entities: updatedEntityArray });
    dispatch(editCollectionSuccess(newCollection));
  };
}

export function removeTemporaryEntitiesFromCollection(importId, collectionId) {
  return (dispatch, getState) => {
    const collection = getState().library.collections[collectionId];

    if (!collection) return;

    const newCollection = { ...collection };

    delete newCollection[importId];

    dispatch(editCollectionSuccess(newCollection));
  };
}
