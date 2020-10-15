import assert from 'assert';
import Immutable from 'immutable';
import columns from '../mocks/columns';
import { columnBasedOnOppositeColumn } from '../../src/utilities/column';

describe('Utility: Columns', () => {
  describe('columnBasedOnOppositeColumn()', () => {
    it("returns all columns when opposite column isn't selected", () => {
      const selectCols = columnBasedOnOppositeColumn(columns, null);

      assert.deepEqual(selectCols, columns);
    });

    it('returns all groups except RQG when normal column is selected', () => {
      const selectCols = columnBasedOnOppositeColumn(Immutable.fromJS(columns), 'display_name');

      assert.deepEqual(
        selectCols.toJS(),
        columns.filter(col => !col.repeatable)
      );
    });

    it('returns only rqg when rqg is selected', () => {
      const selectCols = columnBasedOnOppositeColumn(Immutable.fromJS(columns), 'c2600002');

      assert.deepEqual(
        selectCols.toJS(),
        columns.filter(col => col.repeatable)
      );
    });
  });
});
