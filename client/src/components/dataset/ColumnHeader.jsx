import React, { Component, PropTypes } from 'react';

require('../../styles/ColumnHeader.scss');

export default class ColumnHeader extends Component {

  handleTransformClick(event) {
    event.stopPropagation();

    const el = this.refs.columnTypeLabel;
    const rect = el.getBoundingClientRect();
    const verticalOffset = rect.top + el.offsetHeight;
    const horizontalOffset = rect.left - (el.offsetWidth / 2);

    this.props.onClickTransformContextMenuToggle(this.props.columnTitle,
      this.props.columnType, horizontalOffset, verticalOffset);
  }

  handleColumnMenuClick() {
    const el = this.refs.columnHeaderContainer;
    const rect = el.getBoundingClientRect();
    const verticalOffset = rect.top + el.offsetHeight;
    const horizontalOffset = rect.left;
    const width = el.offsetWidth;

    this.props.onClickColumnMenuToggle(this.props.columnTitle,
      horizontalOffset, verticalOffset, width);
  }

  render() {
    return (
      <div
        className={`ColumnHeader clickable
          ${this.props.columnMenuActive ? 'columnMenuActive' : ''}`}
        ref="columnHeaderContainer"
        onClick={() => this.handleColumnMenuClick()}
      >
        <span
          className="columnType clickable"
        >
          <span
            className="columnTypeToggle"
            onClick={(e) => this.handleTransformClick(e)}
            ref="columnTypeLabel"
          >
            {this.props.columnType}
          </span>
        </span>
        {this.props.children}
      </div>
    );
  }
}

ColumnHeader.propTypes = {
  columnType: PropTypes.string.isRequired,
  columnTitle: PropTypes.string.isRequired,
  onClickTransformContextMenuToggle: PropTypes.func.isRequired,
  children: PropTypes.string.isRequired,
  onClickColumnMenuToggle: PropTypes.func.isRequired,
  columnMenuActive: PropTypes.bool.isRequired,
};
