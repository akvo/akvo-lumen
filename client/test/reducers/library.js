import assert from 'assert';

import reducer, { initialState } from '../../src/reducers/library';
import * as actions from '../../src/actions/library';

describe('library reducer', () => {
  it('should return the initial state', () => {
    assert.equal(reducer(undefined, {}), initialState);
  });
});
