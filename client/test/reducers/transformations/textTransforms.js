import assert from 'assert';
import Immutable from 'immutable';
import reducer from '../../../src/reducers/datasets';
import { transform } from '../../../src/actions/dataset';

const datasets = {
  id: Immutable.fromJS({
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
  }),
};

const action = (op) => transform('id', Immutable.fromJS({
  op,
  args: {
    columnName: 'c1',
    defaultValue: null,
  },
  onError: 'default-value',
}));


describe('Text transforms', () => {
  it('should transform with core/to-titlecase', () => {
    const newDatasets = reducer(
      datasets,
      action('core/to-titlecase')
    );
    assert(Immutable.is(
      newDatasets.id.get('rows').map(row => row.get(0)),
      Immutable.List(['Foo', 'Bar', null, 'Some Text', '  Some \n\n  Text   '])
    ));
  });

  it('should transform with core/to-lowercase', () => {
    const newDatasets = reducer(
      datasets,
      action('core/to-lowercase')
    );
    assert(Immutable.is(
      newDatasets.id.get('rows').map(row => row.get(0)),
      Immutable.List(['foo', 'bar', null, 'some text', '  some \n\n  text   '])
    ));
  });

  it('should transform with core/to-uppercase', () => {
    const newDatasets = reducer(
      datasets,
      action('core/to-uppercase')
    );
    assert(Immutable.is(
      newDatasets.id.get('rows').map(row => row.get(0)),
      Immutable.List(['FOO', 'BAR', null, 'SOME TEXT', '  SOME \n\n  TEXT   '])
    ));
  });

  it('should transform with core/trim', () => {
    const newDatasets = reducer(
      datasets,
      action('core/trim')
    );
    assert(Immutable.is(
      newDatasets.id.get('rows').map(row => row.get(0)),
      Immutable.List(['foo', 'BAR', null, 'SoMe tExt', 'SoMe \n\n  tExt'])
    ));
  });

  it('should transform with core/trim-doublespace', () => {
    const newDatasets = reducer(
      datasets,
      action('core/trim-doublespace')
    );
    assert(Immutable.is(
      newDatasets.id.get('rows').map(row => row.get(0)),
      Immutable.List(['foo', 'BAR', null, 'SoMe tExt', ' SoMe tExt '])
    ));
  });
});
