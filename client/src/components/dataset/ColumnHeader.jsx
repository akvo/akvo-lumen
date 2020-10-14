import React, { Component, useState } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { intlShape, injectIntl } from 'react-intl';
import { MdExpandMore, MdExpandLess } from 'react-icons/md';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

require('./ColumnHeader.scss');

class ColumnHeader extends Component {

  constructor() {
    super();
    this.handleDataTypeMenuClick = this.handleDataTypeMenuClick.bind(this);
    this.handleColumnMenuClick = this.handleColumnMenuClick.bind(this);
    this.handleRemoveSort = this.handleRemoveSort.bind(this);
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
        className={`ColumnHeader ${disabled ? '' : 'clickable'}
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
          data-test-id={column.get('title')}
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
                <OverlayTrigger
                  overlay={
                    <Tooltip>
                      {this.props.intl.formatMessage({ id: column.get('type') })}
                    </Tooltip>
                  }
                >
                  <i className="dataset-type-icon" style={{ backgroundImage: `url(../../styles/img/type-${column.get('type')}.svg)` }} />
                </OverlayTrigger>
              </span>
            </span>
          }
          <ConditionalTooltip>
            {column.get('title')}
          </ConditionalTooltip>
        </span>

        {this.props.columnMenuActive ? (
          <MdExpandLess className="icon" />
        ) : (
          <MdExpandMore className="icon" />
        )}
      </div>
    );
  }
}

const ConditionalTooltip = ({ children }) => {
  const [useTooltip, setUseTooltip] = useState(false); // eslint-disable-line
  const handleRef = (ref) => {
    if (!ref) return;
    if (ref.parentElement.offsetWidth < ref.offsetWidth + 40 && !useTooltip) {
      setUseTooltip(true);
    } else if (ref.parentElement.offsetWidth >= ref.offsetWidth + 40 && useTooltip) {
      setUseTooltip(false);
    }
  };
  if (useTooltip) {
    return [
      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip>
            <span>{children}</span>
          </Tooltip>
        }
      >
        <span className="holder"><span>{children}</span></span>
      </OverlayTrigger>,
    ];
  }
  return [
    <span ref={handleRef}>{children}</span>,
  ];
};

export default injectIntl(ColumnHeader);

ColumnHeader.propTypes = {
  column: PropTypes.object.isRequired,
  onToggleDataTypeContextMenu: PropTypes.func.isRequired,
  onToggleColumnContextMenu: PropTypes.func.isRequired,
  onRemoveSort: PropTypes.func.isRequired,
  columnMenuActive: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  intl: intlShape.isRequired,
};
