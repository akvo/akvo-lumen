import assert from 'assert';
import Immutable from 'immutable';
import applyTransformation from '../../../src/reducers/transform';

const dataset = Immutable.fromJS({
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
});

const action = (op) => Immutable.fromJS({
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
    assert(Immutable.is(
      newDataset.get('rows').map(row => row.get(0)),
      Immutable.List(['Foo', 'Bar', null, 'Some Text', '  Some \n\n  Text   '])
    ));
  });

  it('should transform with core/to-lowercase', () => {
    const newDataset = applyTransformation(
      dataset,
      action('core/to-lowercase')
    );
    assert(Immutable.is(
      newDataset.get('rows').map(row => row.get(0)),
      Immutable.List(['foo', 'bar', null, 'some text', '  some \n\n  text   '])
    ));
  });

  it('should transform with core/to-uppercase', () => {
    const newDataset = applyTransformation(
      dataset,
      action('core/to-uppercase')
    );
    assert(Immutable.is(
      newDataset.get('rows').map(row => row.get(0)),
      Immutable.List(['FOO', 'BAR', null, 'SOME TEXT', '  SOME \n\n  TEXT   '])
    ));
  });

  it('should transform with core/trim', () => {
    const newDataset = applyTransformation(
      dataset,
      action('core/trim')
    );
    assert(Immutable.is(
      newDataset.get('rows').map(row => row.get(0)),
      Immutable.List(['foo', 'BAR', null, 'SoMe tExt', 'SoMe \n\n  tExt'])
    ));
  });

  it('should transform with core/trim-doublespace', () => {
    const newDataset = applyTransformation(
      dataset,
      action('core/trim-doublespace')
    );
    assert(Immutable.is(
      newDataset.get('rows').map(row => row.get(0)),
      Immutable.List(['foo', 'BAR', null, 'SoMe tExt', ' SoMe tExt '])
    ));
  });
});
