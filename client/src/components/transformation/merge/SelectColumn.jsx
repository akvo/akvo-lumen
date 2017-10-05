import React from 'react';
import PropTypes from 'prop-types';
import SelectMenu from '../../common/SelectMenu';

function options(columns, showColumnType) {
  return columns.map((column) => {
    const title = column.get('title');
    const label = showColumnType ? `${title} (${column.get('type')})` : title;
    return {
      label,
      value: column.get('columnName'),
    };
  }).toArray();
}

export default function SelectColumn({
  columns,
  showColumnType = false,
  value,
  onChange,
  placeholder = 'Select Column',
}) {
  return (
    <SelectMenu
      placeholder={placeholder}
      options={options(columns, showColumnType)}
      value={value == null ? null : value.get('columnName')}
      onChange={
        columnName =>
          onChange(columns.find(column => column.get('columnName') === columnName))
        }
    />
  );
}

SelectColumn.propTypes = {
  columns: PropTypes.object.isRequired,
  showColumnType: PropTypes.bool,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};
