import cloneDeep from 'lodash/cloneDeep';
import { columnIndex } from '../../utilities/dataset';

// http://stackoverflow.com/a/196991/24946
function toTitleCase(s) {
  return s.replace(
    /\w\S*/g,
    (str) => str.charAt(0).toUpperCase() + str.substr(1).toLowerCase()
  );
}

function toLowerCase(s) {
  return s.toLowerCase();
}

function toUpperCase(s) {
  return s.toUpperCase();
}

function trim(s) {
  return s.trim();
}

function trimDoublespace(s) {
  return s.replace(/\s+/g, ' ');
}


const transforms = {
  'core/to-titlecase': toTitleCase,
  'core/to-lowercase': toLowerCase,
  'core/to-uppercase': toUpperCase,
  'core/trim': trim,
  'core/trim-doublespace': trimDoublespace,
};

export default function textTransform(dataset, { op, args }) {
  const { columnName } = args;
  const colIndex = columnIndex(columnName, dataset.columns);
  const colType = dataset.columns[colIndex].type;

  if (colType !== 'text') {
    throw new Error(`Can't transform column of type ${colType} with ${op}`);
  }

  const transform = transforms[op];

  const ds = cloneDeep(dataset);

  for (let rowIndex = 0; rowIndex < ds.rows.length; rowIndex++) {
    const val = ds.rows[rowIndex][colIndex];
    ds.rows[rowIndex][colIndex] = val == null ? null : transform(val);
  }

  return ds;
}
