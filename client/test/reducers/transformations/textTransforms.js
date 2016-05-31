import assert from 'assert';
import reducer from '../../../src/reducers/datasets';
import { transform } from '../../../src/actions/dataset';

const datasets = {
  id: {
    id: 'id',
    columns: [{
      type: 'text',
      columnName: 'c1',
      title: 'Text column',
    }],
    rows: [
      ['foo'],
      ['BAR'],
      [null],
      ['SoMe tExt'],
      ['  SoMe \n\n  tExt   '],
    ],
  },
};

const action = (op) => transform('id', {
  op,
  args: {
    columnName: 'c1',
    defaultValue: null,
  },
  onError: 'default-value',
});


describe('Text transforms', () => {
  it('should transform with core/to-titlecase', () => {
    const newDatasets = reducer(
      datasets,
      action('core/to-titlecase')
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      ['Foo', 'Bar', null, 'Some Text', '  Some \n\n  Text   ']
    );
  });

  it('should transform with core/to-lowercase', () => {
    const newDatasets = reducer(
      datasets,
      action('core/to-lowercase')
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      ['foo', 'bar', null, 'some text', '  some \n\n  text   ']
    );
  });

  it('should transform with core/to-uppercase', () => {
    const newDatasets = reducer(
      datasets,
      action('core/to-uppercase')
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      ['FOO', 'BAR', null, 'SOME TEXT', '  SOME \n\n  TEXT   ']
    );
  });

  it('should transform with core/trim', () => {
    const newDatasets = reducer(
      datasets,
      action('core/trim')
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      ['foo', 'BAR', null, 'SoMe tExt', 'SoMe \n\n  tExt']
    );
  });

  it('should transform with core/trim-doublespace', () => {
    const newDatasets = reducer(
      datasets,
      action('core/trim-doublespace')
    );
    assert.deepStrictEqual(
      newDatasets.id.rows.map(row => row[0]),
      ['foo', 'BAR', null, 'SoMe tExt', ' SoMe tExt ']
    );
  });
});
