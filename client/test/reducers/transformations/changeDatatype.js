import assert from 'assert';
import moment from 'moment';
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
      textToNumberAction('default-value', 0)
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

describe('changeDatatype text->date', () => {
  const date1 = '24-12-2016';
  const date2 = '01-01-1971';
  const ts1 = moment(date1, 'DD-MM-YYYY', true).unix() * 1000;
  const ts2 = moment(date2, 'DD-MM-YYYY', true).unix() * 1000;
  const datasets = {
    id: {
      id: 'id',
      columns: [{
        type: 'text',
        columnName: 'c1',
        title: 'Text columns with dates in DD-MM-YYYY format',
      }],
      rows: [
        [date1],
        [date2],
        [null],
        ['not-a-date'],
      ],
    },
  };

  const textToDateAction = (onError, defaultValue) => transform('id', {
    op: 'core/change-datatype',
    args: {
      columnName: 'c1',
      newType: 'date',
      parseFormat: 'DD-MM-YYYY',
      defaultValue,
    },
    onError,
  });
  it('should change text to date with default null value', () => {
    const newDatasets = reducer(
      datasets,
      textToDateAction('default-value', null)
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      [ts1, ts2, null, null]
    );
  });
  it('should change text to date with default timestamp value', () => {
    const newDatasets = reducer(
      datasets,
      textToDateAction('default-value', 0)
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      [ts1, ts2, 0, 0]
    );
  });
  it('should drop rows that cannot be parsed', () => {
    const newDatasets = reducer(
      datasets,
      textToDateAction('delete-row')
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      [ts1, ts2]
    );
  });
});

describe('changeDatatype number->date', () => {
  const datasets = {
    id: {
      id: 'id',
      columns: [{
        type: 'number',
        columnName: 'c1',
        title: 'Numbers with some timestamps',
      }],
      rows: [
        [1482530400000],
        [31528800000],
        [null],
        [-3423],
      ],
    },
  };

  const numberToDateAction = (onError, defaultValue) => transform('id', {
    op: 'core/change-datatype',
    args: {
      columnName: 'c1',
      newType: 'date',
      defaultValue,
    },
    onError,
  });
  it('should change number to date with default null value', () => {
    const newDatasets = reducer(
      datasets,
      numberToDateAction('default-value', null)
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      [1482530400000, 31528800000, null, null]
    );
  });
  it('should change number to date with default 0 value', () => {
    const newDatasets = reducer(
      datasets,
      numberToDateAction('default-value', 0)
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      [1482530400000, 31528800000, 0, 0]
    );
  });
  it('should drop rows that cannot be parsed', () => {
    const newDatasets = reducer(
      datasets,
      numberToDateAction('delete-row')
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      [1482530400000, 31528800000]
    );
  });
});
