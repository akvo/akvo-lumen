// Helper functions for transforming datasets

export function columnIndex(columnName, columns) {
  for (let i = 0; i < columns.length; i++) {
    if (columnName === columns[i].columnName) {
      return i;
    }
  }
  throw new Error(`Column "${columnName}" not found`);
}

export function columnTitle(columnName, columns) {
  return columns[columnIndex(columnName, columns)].title;
}
