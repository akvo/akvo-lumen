import React, { Component, PropTypes } from 'react';

require('../../styles/ColumnHeader.scss');

export default class ColumnHeader extends Component {

  constructor() {
    super();
    this.handleColumnTypeMenuClick = this.handleColumnTypeMenuClick.bind(this);
    this.handleColumnMenuClick = this.handleColumnMenuClick.bind(this);
  }

  handleColumnTypeMenuClick(event) {
    event.stopPropagation();

    const el = this.refs.columnTypeLabel;
    const rect = el.getBoundingClientRect();
    const verticalOffset = rect.top + el.offsetHeight;
    const horizontalOffset = rect.left - (el.offsetWidth / 2);

    const options = {
      columnTitle: this.props.column.title,
      columnType: this.props.column.type,
      left: horizontalOffset,
      top: verticalOffset,
    };

    this.props.onClickMenuToggle('transformContextMenu', options);
  }

  handleColumnMenuClick() {
    const el = this.refs.columnHeaderContainer;
    const rect = el.getBoundingClientRect();
    const verticalOffset = rect.top + el.offsetHeight;
    const horizontalOffset = rect.left;
    const width = el.offsetWidth;

    const options = {
      columnTitle: this.props.column.title,
      left: horizontalOffset,
      top: verticalOffset,
      width,
    };

    this.props.onClickMenuToggle('columnMenu', options);
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
            onClick={this.handleColumnTypeMenuClick}
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
  columnMenuActive: PropTypes.bool.isRequired,
  onClickMenuToggle: PropTypes.func.isRequired,
};
