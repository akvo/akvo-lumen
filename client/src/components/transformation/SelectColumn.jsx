import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import SelectMenu from '../common/SelectMenu';

function options(columns, showColumnType, intl) {
  return columns.map((column) => {
    const title = column.get('title');
    const label = showColumnType ? `${title} (${
      intl.formatMessage({ id: column.get('type') }).toLowerCase()
    }` : title;
    return {
      label,
      value: column.get('columnName'),
    };
  }).toArray();
}

function SelectColumn({
  columns,
  showColumnType = false,
  value,
  onChange,
  placeholder = 'Select Column',
  intl,
}) {
  return (
    <SelectMenu
      placeholder={placeholder}
      options={options(columns, showColumnType, intl)}
      value={value == null ? null : value.get('columnName')}
      onChange={
        columnName =>
          onChange(columns.find(column => column.get('columnName') === columnName))
        }
    />
  );
}

export default injectIntl(SelectColumn);

SelectColumn.propTypes = {
  intl: intlShape,
  columns: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  showColumnType: PropTypes.bool,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};
