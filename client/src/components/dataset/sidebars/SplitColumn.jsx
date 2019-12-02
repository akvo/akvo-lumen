import { merge, get } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable, { fromJS } from 'immutable';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import { connect } from 'react-redux';

import SelectMenu from '../../common/SelectMenu';
import Alert from '../../common/Alert';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import * as API from '../../../utilities/api';
import './SplitColumn.scss';
import { showNotification } from '../../../actions/notification';
import { ensureImmutable } from '../../../utilities/utils';
import { columnSelectOptions, columnSelectSelectedOption } from '../../../utilities/column';

function textColumnOptions(columns) {
  return columns
    .filter(column => (column.get('type') === 'text'))
    .map(column => (fromJS({
      label: column.get('title'),
      value: column.get('columnName'),
      groupName: column.get('groupName'),
    })));
}

function filterByColumnName(columns, columnName) {
  return columns
    .filter(column => column.get('columnName') === columnName)
    .toJS()[0];
}

function SelectColumn({ columns, onChange, value, intl }) {
  const columnsSelect = ensureImmutable(textColumnOptions(columns));

  return (
    <div className="inputGroup">
      <label htmlFor="columnName">
        <FormattedMessage id="select_a_column" />
      </label>
      <SelectMenu
        name="columnName"
        value={columnSelectSelectedOption(value, columnsSelect)}
        onChange={onChange}
        options={columnSelectOptions(intl, columnsSelect)}
      />
    </div>
  );
}

SelectColumn.propTypes = {
  columns: PropTypes.object.isRequired,
  idx: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  intl: intlShape,
};

const SplitColumnOptions = ({
  ui,
  splitable,
  onPatternChange,
  onPrefixChange,
  patternErrorMessage,
  prefixErrorMessage,
}) => {
  const recommendations = (ui.selectedColumn && splitable) ?
    splitable.map(e => `\`${e}\``).join(', ') :
    null;
  const columnTitle = ui.selectedColumn.title;
  return ui && ui.selectedColumn.columnName ? (
    <div>
      <div className="inputGroup">
        <label htmlFor="patternInput">
          <FormattedMessage id="pattern" />
        </label>
        <Alert>
          <div>
            <FormattedMessage id="pattern_subtitle" />
            {recommendations && (
              <div><br />
                <FormattedMessage
                  id="pattern_suggestion"
                  values={{ columnTitle, recommendations }}
                />
              </div>
          )}
          </div>
        </Alert>
        {patternErrorMessage && (
          <Alert danger>
            {patternErrorMessage}
          </Alert>
        )}
        <input
          value={ui.pattern}
          type="text"
          className="titleTextInput"
          onChange={(evt) => {
            onPatternChange(evt.target.value);
          }}
          name="patternInput"
        />
      </div>
      <div className="inputGroup">
        <label htmlFor="newColumnNameInput">
          <FormattedMessage id="prefix" />
        </label>
        {prefixErrorMessage && (
          <Alert danger>
            {prefixErrorMessage}
          </Alert>)}
        <input
          value={ui.newColumnName}
          type="text"
          className="titleTextInput"
          onChange={(evt) => {
            onPrefixChange(evt.target.value);
          }}
          name="newColumnNameInput"
        />
      </div>
    </div>
  ) : null;
};

SplitColumnOptions.propTypes = {
  onPatternChange: PropTypes.func.isRequired,
  onPrefixChange: PropTypes.func.isRequired,
  ui: PropTypes.object.isRequired,
  splitable: PropTypes.array,
  patternErrorMessage: PropTypes.string,
  prefixErrorMessage: PropTypes.string,
};

function apiColumnPatternAnalysis(datasetId, columnName, limit) {
  return API
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
      return response.body;
    });
}

class SplitColumn extends Component {
  constructor() {
    super();
    this.state = {
      transformation: Immutable.fromJS({
        op: 'core/split-column',
        args: {},
        onError: 'fail',
      }),
      splitable: null,
      splitColumn: {
        ui: { columns: [], selectedColumn: { name: null }, pattern: null, newColumnName: null },
      },
      patternErrorMessage: null,
      prefixErrorMessage: null,
    };
    this.handlePatternChange = this.handlePatternChange.bind(this);
    this.handlePrefixChange = this.handlePrefixChange.bind(this);
    this.handleSelectColumn = this.handleSelectColumn.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSelectColumn(columns, columnName, datasetId) {
    const column = filterByColumnName(columns, columnName);
    apiColumnPatternAnalysis(datasetId, columnName, 200)
      .then((apiRes) => {
        if (apiRes.error) {
          if (apiRes.error === 404) {
            this.setState({ error: 'not_found_error' });
          } else {
            this.setState({ error: 'global_error' });
          }
        } else {
          const ui = { selectedColumn: column, pattern: '', newColumnName: '' };
          this.setState({
            error: null,
            splitable: apiRes.analysis,
            splitColumn: {
              ui,
            },
            transformation: this.state.transformation.setIn(['args'], ui),
          });
        }
      })
      .catch(() => {
        this.props.dispatch(showNotification('error', 'Failed to select column.'));
      });
  }

  handlePatternChange(value) {
    const ui = merge(this.state.splitColumn, {
      ui: {
        pattern: value,
      },
    });
    this.setState({
      error: null,
      patternErrorMessage: null,
      ui,
    });
  }

  handlePrefixChange(value) {
    const ui = merge(this.state.splitColumn, {
      ui: {
        newColumnName: value,
      },
    });
    this.setState({
      error: null,
      prefixErrorMessage: null,
      ui,
    });
  }

  handleSubmit() {
    const prefixEmpty = !get(this.state, 'splitColumn.ui.newColumnName.length');
    const patternEmpty = !get(this.state, 'splitColumn.ui.pattern.length');
    if (prefixEmpty || patternEmpty) {
      this.setState({
        prefixErrorMessage: prefixEmpty ?
          this.props.intl.formatMessage({ id: 'field_required' }) :
          null,
        patternErrorMessage: patternEmpty ?
          this.props.intl.formatMessage({ id: 'field_required' }) :
          null,
      });
      return;
    }
    if (this.isValidTransformation()) {
      this.props.onApply(this.state.transformation);
    }
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
    const { onClose, columns, datasetId, intl } = this.props;
    const { splitColumn: { ui: { selectedColumn } } } = this.state;
    const error = this.state.error;
    return (
      <div className="DataTableSidebar">
        <div className="SplitColumnOptions">
          <SidebarHeader onClose={onClose}>
            <FormattedMessage id="split_column" />
          </SidebarHeader>

          <div className="inputs">
            <SelectColumn
              columns={columns}
              idx={1}
              onChange={columnName => this.handleSelectColumn(columns, columnName, datasetId)}
              value={selectedColumn.columnName}
              intl={intl}
            />
            {error ? (
              <div className="alert alert-danger">
                <FormattedMessage id={error} />
              </div>
            ) : (
              <SplitColumnOptions
                ui={this.state.splitColumn.ui}
                onPatternChange={this.handlePatternChange}
                onPrefixChange={this.handlePrefixChange}
                splitable={this.state.splitable}
                prefixErrorMessage={this.state.prefixErrorMessage}
                patternErrorMessage={this.state.patternErrorMessage}
              />
            )}
          </div>

          <SidebarControls
            positiveButtonText={<FormattedMessage id="extract" />}
            onApply={this.handleSubmit}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }
}

SplitColumn.propTypes = {
  intl: intlShape,
  datasetId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

export default connect()(injectIntl(SplitColumn));
