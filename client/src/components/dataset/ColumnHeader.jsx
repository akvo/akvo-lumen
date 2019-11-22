import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

require('./ColumnHeader.scss');

export default class ColumnHeader extends Component {

  constructor() {
    super();
    this.handleDataTypeMenuClick = this.handleDataTypeMenuClick.bind(this);
  }

  handleDataTypeMenuClick(event) {
    event.stopPropagation();

    const el = this.columnTypeLabel;
    const rect = el.getBoundingClientRect();
    const verticalOffset = rect.top + el.offsetHeight;
    const horizontalOffset = rect.left - (el.offsetWidth / 2);

    const dimensions = {
      left: horizontalOffset,
      top: verticalOffset,
    };

    this.props.onToggleDataTypeContextMenu({
      dimensions,
      column: this.props.column,
    });
  }


  render() {
    const { column } = this.props;

    return (
      <div
        className="ColumnHeader"
      >
        <span
          className="columnTitleText"
        >
          {column.get('key') ?
            <span className="columnKey">
              <i className="fa fa-key" aria-hidden />
            </span> :
            <span
              className="columnType clickable"
            >
              <span
                className="columnTypeToggle"
                onClick={this.handleDataTypeMenuClick}
                ref={(ref) => { this.columnTypeLabel = ref; }}
              >
                <FormattedMessage id={column.get('type')} />
              </span>
            </span>
          }
        </span>
      </div>
    );
  }
}

ColumnHeader.propTypes = {
  column: PropTypes.object.isRequired,
  onToggleDataTypeContextMenu: PropTypes.func.isRequired,
  onToggleColumnContextMenu: PropTypes.func.isRequired,
  onRemoveSort: PropTypes.func.isRequired,
  columnMenuActive: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
};
