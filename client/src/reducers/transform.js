
import changeDatatype from './transforms/changeDatatype';

const availableTransforms = {
  'core/change-datatype': changeDatatype,
};

function recordHistory(previousDataset, nextDataset) {
  const history = (nextDataset.history == null ? [] : nextDataset.history).slice(0);
  history.unshift(previousDataset);
  return Object.assign({}, nextDataset, { history });
}

export default function applyTransformation(dataset, transformation) {
  const transformedDataset = availableTransforms[transformation.op](dataset, transformation);
  return recordHistory(dataset, transformedDataset);
}
