import React, { Component, PropTypes } from 'react';

require('../../styles/ColumnHeader.scss');

export default class ColumnHeader extends Component {

  constructor() {
    super();
    this.handleDataTypeMenuClick = this.handleDataTypeMenuClick.bind(this);
    this.handleColumnMenuClick = this.handleColumnMenuClick.bind(this);
  }

  handleDataTypeMenuClick(event) {
    event.stopPropagation();

    const el = this.refs.columnTypeLabel;
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

  handleColumnMenuClick() {
    const el = this.refs.columnHeaderContainer;
    const rect = el.getBoundingClientRect();
    const verticalOffset = rect.top + el.offsetHeight;
    const horizontalOffset = rect.left;
    const width = el.offsetWidth;

    const dimensions = {
      left: horizontalOffset,
      top: verticalOffset,
      width,
    };

    this.props.onToggleColumnContextMenu({
      dimensions,
      column: this.props.column,
    });
  }

  render() {
    return (
      <div
        className={`ColumnHeader clickable
          ${this.props.columnMenuActive ? 'columnMenuActive' : ''}`}
        ref="columnHeaderContainer"
        onClick={this.handleColumnMenuClick}
      >
        <span
          className="columnType clickable"
        >
          <span
            className="columnTypeToggle"
            onClick={this.handleDataTypeMenuClick}
            ref="columnTypeLabel"
          >
            {this.props.column.type}
          </span>
        </span>
        {this.props.column.title}
      </div>
    );
  }
}

ColumnHeader.propTypes = {
  column: PropTypes.shape({
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }),
  onToggleDataTypeContextMenu: PropTypes.func.isRequired,
  onToggleColumnContextMenu: PropTypes.func.isRequired,
  columnMenuActive: PropTypes.bool.isRequired,
};
