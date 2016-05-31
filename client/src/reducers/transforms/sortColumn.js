import cloneDeep from 'lodash/cloneDeep';
import { columnIndex } from '../../utilities/dataset';

const comparator = (type, sortDirection, colIndex) => (rowA, rowB) => {
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

const nextSortLevel = columns => {
  const sortLevels = columns.map(column => column.sort).filter(n => n != null);
  if (sortLevels.length === 0) {
    return 1;
  }
  return sortLevels[sortLevels.length - 1] + 1;
};

export default function sortColumn(dataset, { args }) {
  const { columnName, sortDirection } = args;
  const ds = cloneDeep(dataset);

  const colIndex = columnIndex(columnName, dataset.columns);
  const type = ds.columns[colIndex].type;
  ds.rows.sort(comparator(type, sortDirection, colIndex));
  ds.columns[colIndex].sort = nextSortLevel(ds.columns);
  ds.columns[colIndex].direction = sortDirection;

  return ds;
}
