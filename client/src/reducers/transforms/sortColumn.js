import cloneDeep from 'lodash/cloneDeep';
import { columnIndex } from '../../utilities/dataset';

const columnComparator = (type, sortDirection, colIndex) => (rowA, rowB) => {
  let n;
  const a = rowA[colIndex];
  const b = rowB[colIndex];
  if (a === b) {
    n = 0;
  } else if (a == null) {
    n = -1;
  } else if (b == null) {
    n = 1;
  } else if (type === 'text') {
    n = a.localeCompare(b);
  } else {
    n = (a < b) ? -1 : 1;
  }
  return sortDirection === 'DESC' ? -1 * n : n;
};

function composeComparators(comparators) {
  return comparators.reduce(
    (composedComparator, comparator) => (a, b) => {
      const n = composedComparator(a, b);
      return n === 0 ? comparator(a, b) : n;
    },
    () => 0
  );
}


const nextSortLevel = columns => {
  const sortLevels = columns
    .map(column => column.sort)
    .filter(n => n != null);
  if (sortLevels.length === 0) {
    return 1;
  }
  return sortLevels[sortLevels.length - 1] + 1;
};

function sortedColumns(columns) {
  const cols = columns
    .map((column, colIndex) => Object.assign({}, column, { colIndex }))
    .filter(column => column.sort != null);
  cols.sort((colA, colB) => (colA.sort < colB.sort ? -1 : 1));
  return cols;
}

function buildComparator(columns) {
  const columnsToSort = sortedColumns(columns);
  const columnComparators = columnsToSort.map(column =>
    columnComparator(column.type, column.direction, column.colIndex)
  );
  return composeComparators(columnComparators);
}

export default function sortColumn(dataset, { args }) {
  const { columnName, sortDirection } = args;
  const ds = cloneDeep(dataset);
  const colIndex = columnIndex(columnName, dataset.columns);
  ds.columns[colIndex].sort = nextSortLevel(ds.columns);
  ds.columns[colIndex].direction = sortDirection;
  const comp = buildComparator(ds.columns);
  ds.rows.sort(comp);
  return ds;
}
