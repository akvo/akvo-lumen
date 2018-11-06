import { merge } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { FormattedMessage } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import * as API from '../../../api';

require('./SplitColumn.scss');

function textColumnOptions(columns) {
  return columns
    .filter(column => (column.get('type') === 'text'))
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
    this.onNewColumnName = this.onNewColumnName.bind(this);
  }
  onPattern(evt) {
    this.props.onPattern(evt.target.value);
  }
  onNewColumnName(evt) {
    this.props.onNewColumnName(evt.target.value);
  }
  render() {
    const { ui, splitable } = this.props;
    const recommendations = (ui.selectedColumn && splitable) ? Object.keys(splitable).map(e => `\`${e}\``).join(', ') : null;
    const columnTitle = ui.selectedColumn.title;
    return ui && ui.selectedColumn.columnName ? (
      <div className="inputGroup">
        <h4 className="bolder">
          <FormattedMessage id="pattern" />
        </h4>
        {recommendations ? (<FormattedMessage id="pattern_recommendation" values={{ columnTitle, recommendations }} />) : null}
        <input
          value={ui.pattern}
          type="text"
          className="titleTextInput"
          onChange={this.onPattern}
        />
        <h4 className="bolder">
          <FormattedMessage id="prefix" />
        </h4>
        <FormattedMessage id="new_column_name_prefix" />

        <input
          value={ui.newColumnName}
          type="text"
          className="titleTextInput"
          onChange={this.onNewColumnName}

        />

      </div>
    ) : null;
  }
}

SplitColumni.propTypes = {
  onPattern: PropTypes.func.isRequired,
  onNewColumnName: PropTypes.func.isRequired,
  ui: PropTypes.object.isRequired,
  splitable: PropTypes.object.isRequired,
};

function apiSplitColumn(datasetId, columnName, limit, callback) {
  API
    .get(`/api/split-column/${datasetId}/pattern-analysis`, {
      query: JSON.stringify({
        columnName,
        limit,
      }),
    })
    .then((response) => {
      if (response.status !== 200) {
        return { error: response.status };
      }
      return response.json();
    })
    .then(callback);
}

export default class SplitColumn extends Component {
  constructor() {
    super();
    this.state = {
      transformation: Immutable.fromJS({
        op: 'core/split-column',
        args: {},
        onError: 'fail',
      }),
      splitable: {},
      splitColumn: {
        ui: { columns: [], selectedColumn: { name: null }, pattern: null, newColumnName: null },
      },
    };
    this.onPattern = this.onPattern.bind(this);
    this.onNewColumnName = this.onNewColumnName.bind(this);
    this.onSelectColumn = this.onSelectColumn.bind(this);
  }

  onSelectColumn(columns, columnName, datasetId) {
    const column = filterByColumnName(columns, columnName);
    apiSplitColumn(datasetId, columnName, 200, (apiRes) => {
      if (apiRes.error) {
        if (apiRes.error === 404) {
          this.setState({ error: 'not_found_error' });
        } else {
          this.setState({ error: 'global_error' });
        }
      } else {
        const ui = {};
        ui.selectedColumn = column;
        ui.pattern = '';
        ui.newColumnName = '';
        this.setState({
          error: null,
          splitable: apiRes.analysis,
          splitColumn: {
            ui,
          },
          transformation: this.state.transformation.setIn(['args'], ui),
        });
      }
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
  onNewColumnName(value) {
    const ui = merge(this.state.splitColumn, {
      ui: {
        newColumnName: value,
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
        ui: { selectedColumn, pattern, newColumnName },
      },
    } = this.state;
    return selectedColumn && newColumnName && pattern && pattern.length > 0;
  }

  render() {
    const { onClose, onApply, columns, datasetId } = this.props;
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
            onChange={columnName => this.onSelectColumn(columns, columnName, datasetId)}
            value={selectedColumn.columnName}
          />
          { error ? <div className="feedbackMessage"><FormattedMessage id={error} /></div> :
            (<SplitColumni
              ui={this.state.splitColumn.ui}
              onPattern={this.onPattern}
              onNewColumnName={this.onNewColumnName}
              splitable={this.state.splitable}
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
  datasetId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
};
