import React, { PropTypes } from 'react';
import ContextMenu from '../../common/ContextMenu';

const options = [
  {
    label: 'text',
    value: 'text',
  },
  {
    label: 'number',
    value: 'number',
  },
  {
    label: 'date',
    value: 'date',
  },
];

/* "The job of a context menu is to create props for the sidebar" */
export default function DataTypeContextMenu({ column, style, onMenuItemSelected }) {
  return (
    <ContextMenu
      options={options}
      selected={column.type}
      style={{
        width: '8rem',
        top: `${style.top}px`,
        left: `${style.left}px`,
        right: 'initial',
      }}
      onOptionSelected={item =>
        onMenuItemSelected({
          type: 'edit', // TODO: 'edit' => 'change-column-type' (or something)
          newColumnType: item,
          column,
        })}
      arrowClass="topLeft"
      arrowOffset="15px"
    />
  );
}

DataTypeContextMenu.propTypes = {
  column: PropTypes.object.isRequired,
  style: PropTypes.object.isRequired,
  onMenuItemSelected: PropTypes.func.isRequired,
};
