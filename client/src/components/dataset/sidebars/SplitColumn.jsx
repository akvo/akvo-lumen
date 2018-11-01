import { merge } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { FormattedMessage } from 'react-intl';
import isEmpty from 'lodash/isEmpty';
import SelectMenu from '../../common/SelectMenu';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

require('./SplitColumn.scss');

function textColumnOptions(columns) {
  return columns
    .filter(column => (column.get('type') === 'text' && !isEmpty(column.get('splitable'))))
    .map(column => ({
      label: column.get('title'),
      value: column.get('columnName'),
    }))
    .toJS();
}

function filterByColumnName(columns, columnName) {
  return columns
    .filter(column => column.get('columnName') === columnName)
    .toJS()[0];
}

function SelectColumn({ columns, onChange, value }) {
  return (
    <div className="inputGroup">
      <h4 htmlFor="columnName" className="bolder">
        <FormattedMessage id="select_a_column" />
      </h4>
      <SelectMenu
        name="columnName"
        value={value}
        onChange={onChange}
        options={textColumnOptions(columns)}
      />
    </div>
  );
}

SelectColumn.propTypes = {
  columns: PropTypes.object.isRequired,
  idx: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

class SplitColumni extends Component {

  constructor(props) {
    super(props);
    this.onPattern = this.onPattern.bind(this);
  }
  onPattern(evt) {
    this.props.onPattern(evt.target.value);
  }
  render() {
    const { ui } = this.props;

    return ui ? (
      <div className="inputGroup">
        <h4 className="bolder">
        these are the values we found for spliting this column
        </h4>
        {(ui.selectedColumn && ui.selectedColumn.splitable) ? Object.keys(ui.selectedColumn.splitable).join(', ') : '' }
        <hr />
        <input
          value={ui.pattern}
          type="text"
          className="titleTextInput"
          onChange={this.onPattern}

        />

      </div>
    ) : null;
  }
}

SplitColumni.propTypes = {
  onPattern: PropTypes.func.isRequired,
  ui: PropTypes.object.isRequired,
};

export default class SplitColumn extends Component {
  constructor() {
    super();
    this.state = {
      transformation: Immutable.fromJS({
        op: 'core/split-column',
        args: {},
        onError: 'fail',
      }),

      splitColumn: {
        ui: { columns: [], selectedColumn: { name: null }, pattern: null },
      },
    };
    this.onPattern = this.onPattern.bind(this);
  }

  onSelectColumn(columns, columnName) {
    const column = filterByColumnName(columns, columnName);
    const ui = {};
    ui.selectedColumn = column;
    ui.pattern = '';
    this.setState({
      error: null,
      splitColumn: {
        ui,
      },
      transformation: this.state.transformation.setIn(['args'], ui),
    });
  }

  onPattern(value) {
    const ui = merge(this.state.splitColumn, {
      ui: {
        pattern: value,
      },
    });
    this.setState({
      error: null,
      ui,
    });
  }

  isValidTransformation() {
    const {
      splitColumn: {
        ui: { selectedColumn, pattern },
      },
    } = this.state;
    return selectedColumn && pattern && pattern.length > 0;
  }

  render() {
    const { onClose, onApply, columns } = this.props;
    const { splitColumn: { ui: { selectedColumn } } } = this.state;
    const error = this.state.error;
    return (
      <div className="DataTableSidebar">
        <SidebarHeader onClose={onClose}>
          <FormattedMessage id="split_column" />
        </SidebarHeader>
        <div className="inputs">
          <SelectColumn
            columns={columns}
            idx={1}
            onChange={columnName => this.onSelectColumn(columns, columnName)}
            value={selectedColumn.columnName}
          />
          { error ? <div className="feedbackMessage"><FormattedMessage id={error} /></div> :
            (<SplitColumni
              ui={this.state.splitColumn.ui}
              onPattern={this.onPattern}
            />)
          }
        </div>

        <SidebarControls
          positiveButtonText={<FormattedMessage id="extract" />}
          onApply={
            this.isValidTransformation()
            ? () => onApply(this.state.transformation)
 : () => {}
          }
          onClose={onClose}
        />
      </div>
    );
  }
}

SplitColumn.propTypes = {
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
};
