import cloneDeep from 'lodash/cloneDeep';
import { columnIndex } from '../../domain/dataset';

function getExpressionOperatorAndValue(expression) {
  const expressionOperator = Object.keys(expression)[0];
  return [expressionOperator, expression[expressionOperator]];
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
  return rows.filter(row => filterFn(row[colIndex]));
}

export default function filterTransform(dataset, { args }) {
  const ds = cloneDeep(dataset);
  const { columnName, expression } = args;
  const [expressionOperator, expressionValue] = getExpressionOperatorAndValue(expression);
  const filterFn = filterFunction(expressionOperator, expressionValue);
  const colIndex = columnIndex(columnName, ds.columns);
  ds.rows = applyFilter(ds.rows, colIndex, filterFn);
  return ds;
}
