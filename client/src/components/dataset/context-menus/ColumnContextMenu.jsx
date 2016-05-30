import React, { PropTypes } from 'react';
import ContextMenu from '../../common/ContextMenu';

const actions = {
  'core/to-titlecase': {
    op: 'core/to-titlecase',
    args: {
      defaultValue: null,
    },
    onError: 'default-value',
  },
  'core/to-lowercase': {
    op: 'core/to-lowercase',
    args: {
      defaultValue: null,
    },
    onError: 'default-value',
  },
  'core/to-uppercase': {
    op: 'core/to-uppercase',
    args: {
      defaultValue: null,
    },
    onError: 'default-value',
  },
  'core/trim': {
    op: 'core/trim',
    args: {
      defaultValue: null,
    },
    onError: 'default-value',
  },
  'core/trim-doublespace': {
    op: 'core/trim-doublespace',
    args: {
      defaultValue: null,
    },
    onError: 'default-value',
  },
  'core/filter': {
    op: 'core/filter',
    args: {
      defaultValue: null,
    },
    onError: 'default-value',
  },
};

function mergeArgs(action, args) {
  const a = Object.assign({}, action.args, args);
  return Object.assign({}, action, { args: a });
}

// TODO: Depend on column type!
const options = [{
  label: 'Filter',
  value: 'core/filter',
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
    value: 'core/trim',
  }, {
    label: 'Remove double spaces',
    value: 'core/trim-doublespace',
  }],
}, {
  label: 'Change case',
  value: 'change-case',
  subMenu: [{
    label: 'To Uppercase',
    value: 'core/to-uppercase',
  }, {
    label: 'To Lowercase',
    value: 'core/to-lowercase',
  }, {
    label: 'To Titlecase',
    value: 'core/to-titlecase',
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
      onOptionSelected={(op) => onContextMenuItemSelected({
        column,
        action: mergeArgs(actions[op], { columnName: column.columnName }),
      })}
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
