import React, { PropTypes } from 'react';
import ToggleInput from './ToggleInput';

require('../../../styles/UniqueValueMenu.scss');

const getColumnIndex = (dataset, columnName) =>
  dataset.get('columns').findIndex(column => column.get('columnName') === columnName);

export default function UniqueValueMenu({ dataset, spec, column, filters, onAddFilter, onRemoveFilter, collapsed, toggleCollapsed }) {
  const uniqueValues = dataset.get('rows')
    .map(row => row.get(getColumnIndex(dataset, spec.categoryColumn)))
    .toSet()
    .toArray();

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
                checked
                label={item}
                onChange={() => null}
              />
            </li>
          )}
        </ul>
      }
    </div>
  );
}

UniqueValueMenu.propTypes = {
  // TODO
};
