import assert from 'assert';
import reducer from '../../../src/reducers/datasets';
import { transform } from '../../../src/actions/dataset';

const datasets = {
  id: {
    id: 'id',
    columns: [{
      type: 'text',
      columnName: 'c1',
      title: 'Text column with some numbers',
    }],
    rows: [
      ['123'],
      ['3.14'],
      [null],
      ['not-a-number'],
    ],
  },
};

const textToNumberAction = transform('id', {
  op: 'core/change-datatype',
  args: {
    columnName: 'c1',
    newType: 'number',
    defaultValue: '0',
  },
  onError: 'default-value',
});

describe('changeDatatype reducer', () => {
  it('should change text column to number', () => {
    const newDatasets = reducer(datasets, textToNumberAction);
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      [123, 3.14, 0, 0]
    );
  });
});
