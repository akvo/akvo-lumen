import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import ContextMenu from '../../common/ContextMenu';

const actions = Immutable.fromJS({
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
  'core/filter-column': {
    op: 'core/filter-column',
    args: {},
    onError: 'fail',
  },
  'sort-ascending': {
    op: 'core/sort-column',
    args: { sortDirection: 'ASC' },
    onError: 'fail',
  },
  'sort-descending': {
    op: 'core/sort-column',
    args: { sortDirection: 'DESC' },
    onError: 'fail',
  },
  'rename-column': {
    op: 'core/rename-column',
    args: {},
    onError: 'fail',
  },
  'delete-column': {
    op: 'core/delete-column',
    args: {},
    onError: 'fail',
  },
});

const commonOptions = [{
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
  label: 'Rename Column',
  value: 'rename-column',
}, {
  label: 'Delete Column',
  value: 'delete-column',
}];

const dataTypeOptions = {
  text: [{
    label: 'Filter',
    value: 'core/filter-column',
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
  }],
  number: [],
  date: [],
};

export default function ColumnContextMenu({
  column,
  dimensions,
  onContextMenuItemSelected,
  onWindowClick,
}) {
  return (
    <ContextMenu
      options={commonOptions.concat(dataTypeOptions[column.get('type')])}
      selected={null}
      style={{
        width: `${dimensions.width}px`,
        top: `${dimensions.top}px`,
        left: `${dimensions.left}px`,
        right: 'initial',
      }}
      onOptionSelected={op => onContextMenuItemSelected({
        column,
        action: actions.get(op).setIn(['args', 'columnName'], column.get('columnName')),
      })}
      onWindowClick={onWindowClick}
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
  onWindowClick: PropTypes.func.isRequired,
};
