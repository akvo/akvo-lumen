import assert from 'assert';

import reducer, { initialState } from '../../src/reducers/collections';
import { createCollection } from '../../src/actions/collection';

describe('collections reducer', () => {
  it('should return the initial state', () => {
    assert.equal(reducer(undefined, {}), initialState);
  });
});
