import assert from 'assert';

import reducer, { initialState } from '../../src/reducers/collections';
import createCollection from '../../src/actions/collection';

describe('collections reducer', () => {
  it('should return the initial state', () => {
    assert.equal(reducer(undefined, {}), initialState);
  });

  it('should create a new collection', () => {
    const collectionName = 'Collection Name';
    const action = createCollection(collectionName);
    const id = action.collection.id;
    const nextState = reducer(initialState, action);
    assert.equal(nextState[id].name, collectionName);
  });
});
