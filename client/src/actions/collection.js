import { createAction } from 'redux-actions';
import * as constants from '../constants/collection';
import { push } from 'react-router-redux';
import { hideModal } from './activeModal';
// import * as api from '../api';

// Mock API
const latency = () => 500 + Math.floor(Math.random() * 1500);
const api = {
  post(url, name) {
    if (url === '/api/collections') {
      return new Promise((resolve, reject) => {
        setTimeout(
          () => {
            const id = Math.floor(Math.random() * 1e9);
            const collection = {
              id,
              name,
              type: 'collection',
              entities: [],
            };
            resolve(collection);
          }
        ,
        latency());
      });
    }
  },
  put(url, collection) {
    if (url.indexOf('/api/collections/') > -1) {
      return new Promise((resolve, reject) => {
        setTimeout(
          () => {
            resolve(Object.assign({}, collection));
          }
        ,
        latency());
      });
    }
  },
};

/* Create a new Collection */
export const createCollectionRequest = createAction('CREATE_COLLECTION_REQUEST');
export const createCollectionSuccess = createAction('CREATE_COLLECTION_SUCCESS');
export const createCollectionFailure = createAction('CREATE_COLLECTION_FAILURE');

export function createCollection(name, optionalEntities) {
  return (dispatch) => {
    // dispatch(createCollectionRequest(name));
    api.post('/api/collections', name)
      // .then(response => response.json())
      .then((collection) => {
        dispatch(createCollectionSuccess(collection));
        if (optionalEntities) {
          const collectionWithEntities = Object.assign({}, collection, { entities: optionalEntities });
          dispatch(editCollection(collectionWithEntities));
        }
        dispatch(hideModal());
      })
      .catch((err) => {
        console.log(err);
        dispatch(createCollectionFailure(err));
      });
  };
}

/* Edit an existing collection */
export const editCollectionRequest = createAction('EDIT_COLLECTION_REQUEST');
export const editCollectionFailure = createAction('EDIT_COLLECTION_FAILURE');
export const editCollectionSuccess = createAction('EDIT_COLLECTION_SUCCESS');

export function editCollection(collection) {
  const now = Date.now();
  const dash = Object.assign({}, collection, {
    modified: now,
  });
  const id = collection.id;

  return (dispatch) => {
    dispatch(editCollectionRequest);
    api.put(`/api/collections/${id}`, collection)
      // .then(response => response.json())
      .then(responseCollection => dispatch(editCollectionSuccess(responseCollection)))
      .catch(error => dispatch(editCollectionFailure(error)));
  };
}
