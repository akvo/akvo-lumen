import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import ContextMenu from '../../common/ContextMenu';
import typeIconMap from '../TypeIconMap';

const options = [
  {
    label: [typeIconMap.text, <FormattedMessage id="text" />],
    value: 'text',
  },
  {
    label: [typeIconMap.number, <FormattedMessage id="number" />],
    value: 'number',
  },
  {
    label: [typeIconMap.date, <FormattedMessage id="date" />],
    value: 'date',
  },
];

/* "The job of a context menu is to create props for the sidebar" */
export default function DataTypeContextMenu({
  column,
  dimensions,
  onContextMenuItemSelected,
  onWindowClick,
}) {
  return (
    <ContextMenu
      options={options}
      selected={column.get('type')}
      style={{
        width: '10rem',
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
      onWindowClick={onWindowClick}
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
  onWindowClick: PropTypes.func.isRequired,
};
