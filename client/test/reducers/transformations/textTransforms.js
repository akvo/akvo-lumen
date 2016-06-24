import assert from 'assert';
import applyTransformation from '../../../src/reducers/transform';

const dataset = {
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
};

const action = (op) => ({
  op,
  args: {
    columnName: 'c1',
    defaultValue: null,
  },
  onError: 'default-value',
});


describe('Text transforms', () => {
  it('should transform with core/to-titlecase', () => {
    const newDataset = applyTransformation(
      dataset,
      action('core/to-titlecase')
    );
    assert.deepStrictEqual(
      newDataset.rows.map(row => row[0]),
      ['Foo', 'Bar', null, 'Some Text', '  Some \n\n  Text   ']
    );
  });

  it('should transform with core/to-lowercase', () => {
    const newDataset = applyTransformation(
      dataset,
      action('core/to-lowercase')
    );
    assert.deepStrictEqual(
      newDataset.rows.map(row => row[0]),
      ['foo', 'bar', null, 'some text', '  some \n\n  text   ']
    );
  });

  it('should transform with core/to-uppercase', () => {
    const newDataset = applyTransformation(
      dataset,
      action('core/to-uppercase')
    );
    assert.deepStrictEqual(
      newDataset.rows.map(row => row[0]),
      ['FOO', 'BAR', null, 'SOME TEXT', '  SOME \n\n  TEXT   ']
    );
  });

  it('should transform with core/trim', () => {
    const newDataset = applyTransformation(
      dataset,
      action('core/trim')
    );
    assert.deepStrictEqual(
      newDataset.rows.map(row => row[0]),
      ['foo', 'BAR', null, 'SoMe tExt', 'SoMe \n\n  tExt']
    );
  });

  it('should transform with core/trim-doublespace', () => {
    const newDataset = applyTransformation(
      dataset,
      action('core/trim-doublespace')
    );
    assert.deepStrictEqual(
      newDataset.rows.map(row => row[0]),
      ['foo', 'BAR', null, 'SoMe tExt', ' SoMe tExt ']
    );
  });
});
