import { columnIndex } from '../../domain/dataset';

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

export default function textTransform(dataset, transformation) {
  const op = transformation.get('op');
  const args = transformation.get('args');
  const columnName = args.get('columnName');
  const columns = dataset.get('columns');
  const rows = dataset.get('rows');
  const colIndex = columnIndex(columnName, columns);
  const colType = columns.getIn([colIndex, 'type']);

  if (colType !== 'text') {
    throw new Error(`Can't transform column of type ${colType} with ${op}`);
  }

  const transform = transforms[op];

  const newRows = rows.map(row => {
    const val = row.get(colIndex);
    return row.set(colIndex, val == null ? null : transform(val));
  });

  return dataset.set('rows', newRows);
}
