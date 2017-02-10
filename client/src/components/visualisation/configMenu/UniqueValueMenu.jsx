import React, { PropTypes } from 'react';
import ToggleInput from './ToggleInput';
import { replaceLabelIfValueEmpty } from '../../../utilities/chart';

require('../../../styles/UniqueValueMenu.scss');

const getValueStatus = (title, filters) => !filters.some(filter => filter.value === title);

const handleToggleValue = (title, column, dimension, filters, onChangeSpec) => {
  const newFilters = filters.map(filter => filter);

  if (getValueStatus(title, filters)) {
    newFilters.push({
      column,
      value: title.toString(),
      operation: 'remove',
      strategy: 'is',
      caseSensitive: true,
      origin: `pivot-${dimension}`,
    });
  } else {
    newFilters.splice(
      newFilters.findIndex(filter => (filter.value === title && filter.origin === 'pivot')),
      1
    );
  }

  onChangeSpec({ filters: newFilters });
};

export default function UniqueValueMenu(props) {
  const { tableData, dimension, filters, column, onChangeSpec, collapsed, toggleCollapsed } = props;
  if (!tableData) {
    return <div className="UniqueValueMenu" />;
  }

  const uniqueValues = [];

  switch (dimension) {
    case 'category':
      for (let i = 1; i < tableData.columns.length; i += 1) {
        uniqueValues.push(tableData.columns[i].title);
      }
      filters.filter(filter => filter.origin === 'pivot-category').forEach(filter => uniqueValues.push(filter.value));
      break;

    case 'row':
      for (let i = 1; i < tableData.rows.length; i += 1) {
        uniqueValues.push(tableData.rows[i][0]);
      }
      filters.filter(filter => filter.origin === 'pivot-row').forEach(filter => uniqueValues.push(filter.value));
      break;
    default:
      // Do nothing for now
  }
  uniqueValues.sort();

  return (
    <div className="UniqueValueMenu">
      <div className="header">
        <h4>Category Values</h4>
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
  dimension: PropTypes.oneOf(['category', 'row']).isRequired,
  filters: PropTypes.array.isRequired,
  column: PropTypes.string.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  collapsed: PropTypes.bool.isRequired,
  toggleCollapsed: PropTypes.func.isRequired,
};
