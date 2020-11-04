import Immutable from 'immutable';
import columns from '../mocks/columns';
import { filterColumnsByDataGroupDimension } from '../../src/utilities/column';

describe('Utility: Columns', () => {
  describe('filterColumnsByDataGroupDimension()', () => {
    it("returns all columns when opposite column isn't selected", () => {
      const selectCols = filterColumnsByDataGroupDimension(columns, null);

      expect(selectCols).toEqual(columns);
    });

    it('returns all groups except RQG when normal column is selected', () => {
      const selectCols = filterColumnsByDataGroupDimension(Immutable.fromJS(columns), 'display_name');

      expect(selectCols.toJS()).toEqual(columns.filter(col => !col.repeatable));
    });

    it('returns only rqg when rqg is selected', () => {
      const selectCols = filterColumnsByDataGroupDimension(Immutable.fromJS(columns), 'c2600002');

      expect(selectCols.toJS()).toEqual(columns.filter(col => col.repeatable));
    });
  });
});
