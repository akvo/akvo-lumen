import assert from 'assert';
import reducer from '../../../src/reducers/datasets';
import { transform } from '../../../src/actions/dataset';


describe('changeDatatype text->number', () => {
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

  const textToNumberAction = (onError, defaultValue) => transform('id', {
    op: 'core/change-datatype',
    args: {
      columnName: 'c1',
      newType: 'number',
      defaultValue,
    },
    onError,
  });


  it('should change text column to number', () => {
    const newDatasets = reducer(
      datasets,
      textToNumberAction('default-value', '0')
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      [123, 3.14, 0, 0]
    );
  });
  it('should drop rows that cannot be parsed', () => {
    const newDatasets = reducer(
      datasets,
      textToNumberAction('delete-row')
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      [123, 3.14]
    );
  });
});

describe('changeDatatype number->text', () => {
  const datasets = {
    id: {
      id: 'id',
      columns: [{
        type: 'number',
        columnName: 'c1',
        title: 'Number columns',
      }],
      rows: [
        [123],
        [3.14],
        [null],
        [-12],
      ],
    },
  };

  const numberToTextAction = (onError, defaultValue) => transform('id', {
    op: 'core/change-datatype',
    args: {
      columnName: 'c1',
      newType: 'text',
      defaultValue,
    },
    onError,
  });


  it('should change number to text with default N/A value', () => {
    const newDatasets = reducer(
      datasets,
      numberToTextAction('default-value', 'N/A')
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      ['123', '3.14', 'N/A', '-12']
    );
  });
  it('should drop rows that cannot be parsed', () => {
    const newDatasets = reducer(
      datasets,
      numberToTextAction('delete-row')
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      ['123', '3.14', '-12']
    );
  });
});
