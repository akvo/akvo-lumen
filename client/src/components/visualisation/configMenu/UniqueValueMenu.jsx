import React from 'react';
import PropTypes from 'prop-types';
import ToggleInput from '../../common/ToggleInput';
import { replaceLabelIfValueEmpty } from '../../../utilities/chart';

require('./UniqueValueMenu.scss');

const getValueStatus = (title, filters) => !filters.some(filter => filter.value === title);

const handleToggleValue = (title, column, dimension, filters, onChangeSpec) => {
  const newFilters = filters.map(filter => filter);

  if (getValueStatus(title, filters)) {
    newFilters.push({
      column,
      value: title === null ? null : title.toString(),
      operation: 'remove',
      strategy: title === null ? 'isEmpty' : 'is',
      caseSensitive: true,
      origin: `pivot-${dimension}`,
    });
  } else {
    newFilters.splice(
      newFilters.findIndex(filter => (filter.value === title && filter.origin === `pivot-${dimension}`)),
      1
    );
  }

  onChangeSpec({ filters: newFilters });
};

export default function UniqueValueMenu(props) {
  const { tableData, dimension, filters, column, onChangeSpec, collapsed, toggleCollapsed } = props;
  if (!tableData || !tableData.columns || tableData.rows) {
    return <div className="UniqueValueMenu" />;
  }

  const uniqueValues = [];

  switch (dimension) {
    case 'column':
      for (let i = 1; i < tableData.columns.length; i += 1) {
        uniqueValues.push(tableData.columns[i].title);
      }
      filters.filter(filter => filter.origin === `pivot-${dimension}`).forEach(filter => uniqueValues.push(filter.value));
      break;

    case 'row':
      for (let i = 0; i < tableData.rows.length; i += 1) {
        uniqueValues.push(tableData.rows[i][0]);
      }
      filters.filter(filter => filter.origin === `pivot-${dimension}`).forEach(filter => uniqueValues.push(filter.value));
      break;
    default:
      // Do nothing for now
  }
  uniqueValues.sort();

  return (
    <div className={`UniqueValueMenu ${collapsed ? 'collapsed' : 'expanded'}`}>
      <div className="header">
        <h4>{`${dimension.substring(0, 1).toUpperCase()}${dimension.substring(1, dimension.length)}`} values</h4>
        <button
          className="collapseToggle clickable"
          onClick={toggleCollapsed}
        >
          {collapsed ? '+' : '-'}
        </button>
      </div>
      {!collapsed &&
        <ul>
          {uniqueValues.map((item, index) =>
            <li
              className="uniqueValueItem"
              key={index}
            >
              <ToggleInput
                checked={getValueStatus(item, filters)}
                label={replaceLabelIfValueEmpty(item)}
                onChange={() => handleToggleValue(item, column, dimension, filters, onChangeSpec)}
              />
            </li>
          )}
        </ul>
      }
    </div>
  );
}

UniqueValueMenu.propTypes = {
  tableData: PropTypes.object,
  dimension: PropTypes.oneOf(['column', 'row']).isRequired,
  filters: PropTypes.array.isRequired,
  column: PropTypes.string.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  collapsed: PropTypes.bool.isRequired,
  toggleCollapsed: PropTypes.func.isRequired,
};
