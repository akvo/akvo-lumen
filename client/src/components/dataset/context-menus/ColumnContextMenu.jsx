import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
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

const commonOptions = [
  {
    label: <FormattedMessage id="sort" />,
    value: 'sort',
    subMenu: [
      {
        label: <FormattedMessage id="ascending" />,
        value: 'sort-ascending',
      },
      {
        label: <FormattedMessage id="descending" />,
        value: 'sort-descending',
      },
    ],
  },
  {
    label: <FormattedMessage id="rename_column" />,
    value: 'rename-column',
  },
  {
    label: <FormattedMessage id="delete_column" />,
    value: 'delete-column',
  },
];

const dataTypeOptions = ({
  text: [
    {
      label: <FormattedMessage id="filter" />,
      value: 'core/filter-column',
    },
    {
      label: <FormattedMessage id="whitespace" />,
      value: 'whitespace',
      subMenu: [{
        label: <FormattedMessage id="remove_leading_and_trailing_whitespace" />,
        value: 'core/trim',
      },
      {
        label: <FormattedMessage id="remove_double_space" />,
        value: 'core/trim-doublespace',
      },
      ],
    },
    {
      label: <FormattedMessage id="change_case" />,
      value: 'change-case',
      subMenu: [
        {
          label: <FormattedMessage id="to_uppercase_label" />,
          value: 'core/to-uppercase',
        },
        {
          label: <FormattedMessage id="to_lowercase_label" />,
          value: 'core/to-lowercase',
        },
        {
          label: <FormattedMessage id="to_titlecase_label" />,
          value: 'core/to-titlecase',
        },
      ],
    },
  ],
  number: [],
  date: [],
  geopoint: [],
  multiple: [],
});

export default function ColumnContextMenu({
  column,
  dimensions,
  onContextMenuItemSelected,
  onWindowClick,
  left,
}) {
  return (
    <ContextMenu
      options={commonOptions.concat(dataTypeOptions[column.get('type')])}
      selected={null}
      subMenuSide={left ? 'left' : 'right'}
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
  left: PropTypes.bool,
};
