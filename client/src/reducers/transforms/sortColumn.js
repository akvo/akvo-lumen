import { columnIndex } from '../../domain/dataset';

const columnComparator = (type, sortDirection, colIndex) => (rowA, rowB) => {
  let n;
  const a = rowA.get(colIndex);
  const b = rowB.get(colIndex);
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
    .map(column => column.get('sort'))
    .filter(n => n != null);
  if (sortLevels.size === 0) {
    return 1;
  }
  return sortLevels.get(-1) + 1;
};

function sortedColumns(columns) {
  const cols = columns
    .map((column, colIndex) => column.set('colIndex', colIndex))
    .filter(column => column.get('sort') != null);
  return cols.sort((colA, colB) => (colA.sort < colB.sort ? -1 : 1));
}

function buildComparator(columns) {
  const columnsToSort = sortedColumns(columns);
  const columnComparators = columnsToSort.map(column =>
    columnComparator(column.get('type'), column.get('direction'), column.get('colIndex'))
  );
  return composeComparators(columnComparators);
}

function sortColumns(dataset) {
  const comp = buildComparator(dataset.get('columns'));
  const rows = dataset.get('rows').sort(comp);
  return dataset.set('rows', rows);
}

export default function sortTransform(dataset, transformation) {
  const op = transformation.get('op');
  const args = transformation.get('args');
  const columnName = args.get('columnName');
  const sortDirection = args.get('sortDirection');
  const colIndex = columnIndex(columnName, dataset.get('columns'));
  let ds;
  if (op === 'core/sort-column') {
    ds = dataset
      .setIn(['columns', colIndex, 'sort'], nextSortLevel(dataset.get('columns')))
      .setIn(['columns', colIndex, 'direction'], sortDirection);
  } else if (op === 'core/remove-sort') {
    ds = dataset
      .deleteIn(['columns', colIndex, 'sort'])
      .deleteIn(['columns', colIndex, 'direction']);
  } else {
    throw new Error(`Unknown sort transform ${op}`);
  }
  return sortColumns(ds);
}
