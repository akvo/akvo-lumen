
import changeDatatype from './transforms/changeDatatype';

const availableTransforms = {
  'core/change-datatype': changeDatatype,
};

function recordHistory(previousDataset, nextDataset) {
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
  const transformedDataset = availableTransforms[transformation.op](dataset, transformation);
  if (transformedDataset === dataset) {
    return dataset;
  }
  return updateTransformationLog(recordHistory(dataset, transformedDataset), transformation);
}
