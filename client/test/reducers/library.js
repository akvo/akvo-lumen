import assert from 'assert';

import reducer, { initialState } from '../../src/reducers/library';
import * as actions from '../../src/actions/library';

describe('library reducer', () => {
  it('should return the initial state', () => {
    assert.equal(reducer(undefined, {}), initialState);
  });
  it('should handle changeDisplayMode', () => {
    assert.equal(
      reducer(initialState, actions.changeDisplayMode('GRID')).displayMode,
      'GRID'
    );
  });
  it('should handle changeSortOrder', () => {
    assert.equal(
      reducer(initialState, actions.changeSortOrder('CREATED')).sortOrder,
      'CREATED'
    );
  });
  it('should handle changeFilterBy', () => {
    assert.equal(
      reducer(initialState, actions.changeFilterBy('DASHBOARD')).filterBy,
      'DASHBOARD'
    );
  });
  it('should handle setSearchString', () => {
    assert.equal(
      reducer(initialState, actions.setSearchString('abc')).searchString,
      'abc'
    );
  });
});
