
export function getTransformations(entity) {
  return entity.get('transformations');
}

export function getColumns(entity) {
  return entity.get('columns');
}

export function getRows(entity) {
  return entity.get('rows');
}

export function getIsLockedFromTransformations(entity) {
  return entity.get('isLockedFromTransformations');
}

export function columnIndex(columnName, columns) {
  const res = columns.findEntry(column => column.get('columnName') === columnName);
  if (res != null) {
    return res[0];
  }
  throw new Error(`Column "${columnName}" not found`);
}

export function columnTitle(columnName, columns) {
  return columns.getIn([columnIndex(columnName, columns), 'title']);
}
