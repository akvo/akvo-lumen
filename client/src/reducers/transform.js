import Immutable from 'immutable';
import changeDatatype from './transforms/changeDatatype';
import textTransform from './transforms/text';
import sortTransform from './transforms/sortColumn';
import filterTransform from './transforms/filterColumn';

const availableTransforms = {
  'core/change-datatype': changeDatatype,
  'core/to-titlecase': textTransform,
  'core/to-lowercase': textTransform,
  'core/to-uppercase': textTransform,
  'core/trim': textTransform,
  'core/trim-doublespace': textTransform,
  'core/sort-column': sortTransform,
  'core/remove-sort': sortTransform,
  'core/filter-column': filterTransform,
};

export default function applyTransformation(dataset, transformation) {
  try {
    const transformedDataset =
      availableTransforms[transformation.get('op')](dataset, transformation);

    if (Immutable.is(transformedDataset, dataset)) {
      return dataset;
    }

    return transformedDataset
      .update('transformations', transformations => (
        transformations == null ?
          Immutable.List.of(transformation) : transformations.push(transformation)
        ))
      .update('history', history => (
        history == null ?
          Immutable.List.of(dataset) : history.push(dataset)
        ));
  } catch (e) {
    if (transformation.onError === 'fail') {
      return dataset;
    }
    throw e;
  }
}
