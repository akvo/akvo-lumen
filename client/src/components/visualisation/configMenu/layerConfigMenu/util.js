/* eslint-disable import/prefer-default-export */

export const getSelectMenuOptionsFromColumnList = columns => (columns == null ?
  [] : columns.map((column, index) => ({
    value: `${column.get('columnName')}`,
    index: index.toString(),
    title: `${column.get('title')}`,
    label: `${column.get('title')} (${column.get('type')})`,
    type: `${column.get('type')}`,
  })).toArray());
