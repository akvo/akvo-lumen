import React, { Component, PropTypes } from 'react';

require('../../styles/ColumnHeader.scss');

export default class ColumnHeader extends Component {

  constructor() {
    super();
    this.handleDataTypeMenuClick = this.handleDataTypeMenuClick.bind(this);
    this.handleColumnMenuClick = this.handleColumnMenuClick.bind(this);
    this.handleRemoveSort = this.handleRemoveSort.bind(this);
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

  handleRemoveSort(event, column) {
    event.stopPropagation();
    this.props.onRemoveSort({
      op: 'core/remove-sort',
      args: { columnName: column.columnName },
      onError: 'fail',
    });
  }

  // TODO: move column.get(...) to domain/dataset.js
  render() {
    const { column } = this.props;
    return (
      <div
        className={`ColumnHeader clickable
          ${this.props.columnMenuActive ? 'columnMenuActive' : ''}`}
        ref="columnHeaderContainer"
        onClick={this.handleColumnMenuClick}
      >
        {column.get('sort') != null ?
          <div
            className="sortLabel"
          >
            Sort: {column.get('direction') === 'ASC' ? 'Ascending' : 'Descending'}
            <span
              className="cancelSort"
              onClick={(event) => this.handleRemoveSort(event, column)}
            >
              +
            </span>
          </div>
          : null
        }
        <span
          className="columnType clickable"
        >
          <span
            className="columnTypeToggle"
            onClick={this.handleDataTypeMenuClick}
            ref="columnTypeLabel"
          >
            {column.get('type')}
          </span>
        </span>
        <span
          className="columnTitleText"
        >
          {column.get('title')}
        </span>
      </div>
    );
  }
}

ColumnHeader.propTypes = {
  column: PropTypes.object.isRequired,
/*  column: PropTypes.shape({
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    sort: PropTypes.number,
    direction: PropTypes.oneOf(['ASC', 'DESC']),
  }), */
  onToggleDataTypeContextMenu: PropTypes.func.isRequired,
  onToggleColumnContextMenu: PropTypes.func.isRequired,
  onRemoveSort: PropTypes.func.isRequired,
  columnMenuActive: PropTypes.bool.isRequired,
};
