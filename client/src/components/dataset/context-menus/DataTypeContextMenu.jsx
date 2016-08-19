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
export default function DataTypeContextMenu({ column, dimensions, onContextMenuItemSelected }) {
  return (
    <ContextMenu
      options={options}
      selected={column.get('type')}
      style={{
        width: '8rem',
        top: `${dimensions.top}px`,
        left: `${dimensions.left}px`,
        right: 'initial',
      }}
      onOptionSelected={item =>
        onContextMenuItemSelected({
          column,
          newColumnType: item,
          dataTypeOptions: options,
        })}
      arrowClass="topLeft"
      arrowOffset="15px"
    />
  );
}

DataTypeContextMenu.propTypes = {
  column: PropTypes.object.isRequired,
  dimensions: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
  }).isRequired,
  onContextMenuItemSelected: PropTypes.func.isRequired,
};
