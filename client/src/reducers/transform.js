
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

function recordHistory(previousDataset, nextDataset) {
  // Do we really need to keep history-on-the-history?
  const history = (nextDataset.history || []).slice(0);
  history.unshift(previousDataset);
  return Object.assign({}, nextDataset, { history });
}

function updateTransformationLog(dataset, transformation) {
  const transformations = (dataset.transformations || []).slice(0);
  transformations.push(transformation);
  return Object.assign({}, dataset, { transformations });
}

export default function applyTransformation(dataset, transformation) {
  try {
    const transformedDataset = availableTransforms[transformation.op](dataset, transformation);
    if (transformedDataset === dataset) {
      return dataset;
    }
    return updateTransformationLog(recordHistory(dataset, transformedDataset), transformation);
  } catch (e) {
    if (transformation.onError === 'fail') {
      return dataset;
    }
    throw e;
  }
}
