import { columnIndex } from '../../domain/dataset';

function getExpressionOperatorAndValue(expression) {
  return expression.entrySeq().first();
}

function filterFunction(expressionOperator, expressionValue) {
  const regexp = new RegExp(expressionValue, 'i');
  switch (expressionOperator) {
    case 'is':
      return s => s === expressionValue;
    case 'contains':
      return s => (s == null ? false : s.match(regexp));
    default:
      throw new Error(`Unkonwn filter operator ${expressionOperator}`);
  }
}

function applyFilter(rows, colIndex, filterFn) {
  return rows.filter(row => filterFn(row.get(colIndex)));
}

export default function filterTransform(dataset, transformation) {
  const columnName = transformation.getIn(['args', 'columnName']);
  const expression = transformation.getIn(['args', 'expression']);
  const [expressionOperator, expressionValue] = getExpressionOperatorAndValue(expression);
  const filterFn = filterFunction(expressionOperator, expressionValue);
  const colIndex = columnIndex(columnName, dataset.get('columns'));
  const rows = applyFilter(dataset.get('rows'), colIndex, filterFn);
  return dataset.set('rows', rows);
}
