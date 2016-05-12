import React, { Component, PropTypes } from 'react';

export default class ColumnHeader extends Component {

  handleTransformClick() {
    const el = this.refs.columnTypeLabel;
    const rect = el.getBoundingClientRect();
    const verticalOffset = rect.top + el.offsetHeight;
    const horizontalOffset = rect.left - (el.offsetWidth / 2);

    this.props.onClickTransformContextMenuToggle(this.props.columnTitle,
      this.props.columnType, horizontalOffset, verticalOffset);
  }

  render() {
    return (
      <div className="ColumnHeader">
        <span
          className="columnType clickable"
        >
          <span
            className="columnTypeToggle"
            onClick={() => this.handleTransformClick()}
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
};
