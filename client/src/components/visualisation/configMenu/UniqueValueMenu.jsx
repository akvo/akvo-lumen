import React from 'react';
import PropTypes from 'prop-types';
import ToggleInput from './ToggleInput';
import { replaceLabelIfValueEmpty } from '../../../utilities/chart';

require('./UniqueValueMenu.scss');

const getValueStatus = (title, filters) => !filters.some(filter => filter.value === title);

const handleToggleValue = (item, column, dimension, filters, onChangeSpec) => {
  const newFilters = filters.map(filter => filter);
  let valueForType;

  switch (item.type) {
    case 'date':
      valueForType = new Date(item.title).getTime().toString();
      break;
    case 'number':
    case 'string':
    default:
      valueForType = item.title ? item.title.toString() : null;
  }

  if (getValueStatus(valueForType, filters)) {
    newFilters.push({
      column,
      value: valueForType,
      operation: 'remove',
      strategy: valueForType === null ? 'isEmpty' : 'is',
      caseSensitive: true,
      origin: `pivot-${dimension}`,
    });
  } else {
    newFilters.splice(
      newFilters.findIndex(filter => (filter.value === item.title && filter.origin === `pivot-${dimension}`)),
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
    case 'column':
      for (let i = 1; i < tableData.columns.length; i += 1) {
        const item = {
          title: tableData.columns[i].title,
          type: props.columnType,
        };
        uniqueValues.push(item);
      }
      filters.filter(filter => filter.origin === `pivot-${dimension}`).forEach(filter => uniqueValues.push({ title: filter.value }));
      break;

    case 'row':
      for (let i = 0; i < tableData.rows.length; i += 1) {
        uniqueValues.push({
          title: tableData.rows[i][0],
          type: props.columnType,
        });
      }
      filters.filter(filter => filter.origin === `pivot-${dimension}`).forEach(filter => uniqueValues.push({ title: filter.value }));
      break;
    default:
      // Do nothing for now
  }
  if (props.columnType === 'text') {
    uniqueValues.sort((a, b) => {
      const da = a.title === null ? '' : a.title.toString();
      const db = b.title === null ? '' : b.title.toString();

      return da > db;
    });
  } else if (props.columnType === 'number') {
    uniqueValues.sort((a, b) => {
      const da = a.title === null ? Infinity : parseFloat(a.title);
      const db = b.title === null ? Infinity : parseFloat(b.title);

      return da - db;
    });
  }

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
                checked={getValueStatus(item.title, filters)}
                label={replaceLabelIfValueEmpty(item.title)}
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
  columnType: PropTypes.oneOf(['text', 'number', 'date']).isRequired,
};
