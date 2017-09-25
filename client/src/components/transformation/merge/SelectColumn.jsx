import React from 'react';
import PropTypes from 'prop-types';
import SelectMenu from '../../common/SelectMenu';

function options(columns) {
  return columns.map(column => ({
    label: column.get('title'),
    value: column.get('columnName'),
  })).toArray();
}

export default function SelectColumn({ columns, value, onChange, placeholder = 'Select Column' }) {
  return (
    <SelectMenu
      placeholder={placeholder}
      options={options(columns)}
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
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};
