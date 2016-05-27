import React, { PropTypes } from 'react';
import ContextMenu from '../../common/ContextMenu';

// TODO: Depend on column type!
const options = [{
  label: 'Filter',
  value: 'filter',
}, {
  label: 'Sort',
  value: 'sort',
  subMenu: [{
    label: 'Ascending',
    value: 'sort-ascending',
  }, {
    label: 'Descending',
    value: 'sort-descending',
  }],
}, {
  label: 'Whitespace',
  value: 'whitespace',
  subMenu: [{
    label: 'Remove leading and trailing whitespace',
    value: 'remove-leading-trailing-whitespace',
  }, {
    label: 'Remove double spaces',
    value: 'remove-double-whitespace',
  }],
}, {
  label: 'Change case',
  value: 'change-case',
  subMenu: [{
    label: 'To Uppercase',
    value: 'to-uppercase',
  }, {
    label: 'To Lowercase',
    value: 'to-lowercase',
  }, {
    label: 'To Titlecase',
    value: 'to-titlecase',
  }],
}];

export default function ColumnContextMenu({ column, dimensions, onContextMenuItemSelected }) {
  return (
    <ContextMenu
      options={options}
      selected={null}
      style={{
        width: `${dimensions.width}px`,
        top: `${dimensions.top}px`,
        left: `${dimensions.left}px`,
        right: 'initial',
      }}
      onOptionSelected={(item) => onContextMenuItemSelected({ column, menuItem: item })}
    />
  );
}

ColumnContextMenu.propTypes = {
  column: PropTypes.object.isRequired,
  dimensions: PropTypes.shape({
    width: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
  }).isRequired,
  onContextMenuItemSelected: PropTypes.func.isRequired,
};
