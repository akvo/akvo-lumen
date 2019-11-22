import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

require('./ColumnGroupHeader.scss');

export default class ColumnGroupHeader extends Component {

  constructor() {
    super();
    this.handleColumnMenuClick = this.handleColumnMenuClick.bind(this);
    this.handleRemoveSort = this.handleRemoveSort.bind(this);
  }

  handleColumnMenuClick() {
    const el = this.columnHeaderContainer;
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
    this.props.onRemoveSort(Immutable.fromJS({
      op: 'core/remove-sort',
      args: { columnName: column.get('columnName') },
      onError: 'fail',
    }));
  }

  render() {
    const { column, disabled } = this.props;

    return (
      <div
        className={`ColumnGroupHeader ${disabled ? '' : 'clickable'}
          ${this.props.columnMenuActive ? 'columnMenuActive' : ''}`}
        ref={(ref) => { this.columnHeaderContainer = ref; }}
        onClick={this.handleColumnMenuClick}
      >
        {column.get('sort') != null ?
          <div
            className="sortLabel"
          >
            Sort: {column.get('direction') === 'ASC' ? 'Ascending' : 'Descending'}
            <span
              className="cancelSort"
              onClick={event => this.handleRemoveSort(event, column)}
            >
              ✕
            </span>
          </div>
          : null
        }
        <span
          className="columnTitleText"
          title={column.get('title')}
          data-test-id={column.get('title')}
        >
          {column.get('title')}
        </span>
      </div>
    );
  }
}

ColumnGroupHeader.propTypes = {
  column: PropTypes.object.isRequired,
  onToggleDataTypeContextMenu: PropTypes.func.isRequired,
  onToggleColumnContextMenu: PropTypes.func.isRequired,
  onRemoveSort: PropTypes.func.isRequired,
  columnMenuActive: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
};
