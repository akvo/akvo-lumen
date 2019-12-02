import { merge, cloneDeep } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { FormattedMessage, intlShape } from 'react-intl';
import { connect } from 'react-redux';

import SelectMenu from '../../common/SelectMenu';
import ToggleInput from '../../common/ToggleInput';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import * as API from '../../../utilities/api';
import { showNotification } from '../../../actions/notification';
import { ensureImmutable } from '../../../utilities/utils';
import { columnSelectOptions, columnSelectSelectedOption } from '../../../utilities/column';

require('./ExtractMultiple.scss');

const multipleTypes = new Set(['caddisfly', 'geo-shape-features']);

function multipleTypeCondition(column) {
  return multipleTypes.has(column.get('multipleType'));
}

function textColumnOptions(columns) {
  return columns
    .filter(column => column.get('type') === 'multiple' && multipleTypeCondition(column))
    .map(column => ({
      label: column.get('title'),
      groupName: column.get('groupName'),
      value: column.get('columnName'),
    }))
    .toJS();
}

function filterByMultipleAndColumnName(columns, columnName) {
  return columns
    .filter(column => column.get('type') === 'multiple' && multipleTypeCondition(column) && column.get('columnName') === columnName)
    .toJS()[0];
}

function SelectColumn({ columns, onChange, value, intl }) {
  const columnsSelect = ensureImmutable(textColumnOptions(columns));

  return (
    <div className="inputGroup">
      <h4 htmlFor="columnName" className="bolder">
        <FormattedMessage id="select_multiple_column" />
      </h4>
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

function MultipleColumnImage(props) {
  const { hasImage, extractImage, onExtractImage } = props;
  if (hasImage) {
    return (
      <div>
        <hr />
        <ToggleInput
          name="image"
          type="checkbox"
          labelId="Image"
          className={`valueToExtract ${extractImage ? 'checked' : ''}`}
          checked={extractImage}
          onChange={onExtractImage}
        /></div>
    );
  }
  return null;
}

MultipleColumnImage.propTypes = {
  hasImage: PropTypes.bool.isRequired,
  extractImage: PropTypes.bool.isRequired,
  onExtractImage: PropTypes.func.isRequired,
};

class Column extends Component {
  constructor(props) {
    super(props);
    this.props.onExtractColumn(false);
    this.onColumnName = this.onColumnName.bind(this);
  }

  onColumnName(evt) {
    this.props.onColumnName(evt.target.value);
  }
  render() {
    const { api, ui } = this.props;
    return (
      <div className="inputGroup">
        <hr />
        <div className="inputGroup">
          <ToggleInput
            name="extractColumn"
            type="checkbox"
            className={`valueToExtract ${ui.extract ? 'checked' : ''}`}
            checked={ui.extract}
            label={api.name}
            onChange={this.props.onExtractColumn}
          />
        </div>
        {ui.extract ? (
          <div>
            <label htmlFor="titleTextInput" >
              <FormattedMessage id="new_column_title" />
            </label>
            <input
              value={ui.name}
              type="text"
              className="titleTextInput"
              onChange={this.onColumnName}
              data-test-id={`column-title-${api.id}`}
            />
          </div>
        ) : (
           null
        )}
      </div>
    );
  }
}
Column.propTypes = {
  onExtractColumn: PropTypes.func.isRequired,
  onColumnName: PropTypes.func.isRequired,
  api: PropTypes.object.isRequired,
  ui: PropTypes.object.isRequired,
};

function MultipleColumnList(props) {
  const { onColumnName, onExtractColumn } = props;
  const columns = props.api.columns || [];
  const columList = columns.map((column, index) => (
    <Column
      key={column.id}
      api={column}
      ui={props.ui.columns[index]}
      idx={index}
      onColumnName={onColumnName(index)}
      onExtractColumn={onExtractColumn(index)}
    />
  ));
  return <div className="inputGroup">{columList}</div>;
}

MultipleColumnList.propTypes = {
  onExtractColumn: PropTypes.func.isRequired,
  onColumnName: PropTypes.func.isRequired,
  api: PropTypes.object.isRequired,
  ui: PropTypes.object.isRequired,
};

function MultipleColumn(props) {
  const {
    api,
    ui,
    onExtractImage,
    onColumnName,
    onExtractColumn,
  } = props;

  return api ? (
    <div className="inputGroup">
      <h4 className="bolder"><FormattedMessage id="select_values_to_extract" /></h4>
      <MultipleColumnImage
        hasImage={api.hasImage}
        extractImage={ui.extractImage}
        onExtractImage={onExtractImage}
      />
      <MultipleColumnList
        api={api}
        ui={ui}
        onColumnName={onColumnName}
        onExtractColumn={onExtractColumn}
      />
    </div>
  ) : null;
}

MultipleColumn.propTypes = {
  api: PropTypes.object,
  ui: PropTypes.object.isRequired,
  onExtractImage: PropTypes.func.isRequired,
  onColumnName: PropTypes.func.isRequired,
  onExtractColumn: PropTypes.func.isRequired,
};

function apiMultipleColumn(column, callback) {
  return API
    .get('/api/multiple-column', {
      query: JSON.stringify({
        multipleType: column.multipleType,
        multipleId: column.multipleId,
      }),
    })
    .then((response) => {
      if (response.status !== 200) {
        return { error: response.status };
      }
      return response.body;
    })
    .then(callback);
}

class ExtractMultiple extends Component {
  constructor() {
    super();
    this.state = {
      transformation: Immutable.fromJS({
        op: 'core/extract-multiple',
        args: {},
        onError: 'fail',
      }),

      extractMultiple: {
        api: null,
        ui: { extractImage: null, columns: [], selectedColumn: { name: null } },
      },
    };
    this.onExtractImage = this.onExtractImage.bind(this);
    this.onColumnName = this.onColumnName.bind(this);
    this.onExtractColumn = this.onExtractColumn.bind(this);
  }

  onExtractColumn(idx) {
    return (extractColumn) => {
      if (!extractColumn) {
        this.onColumnName(idx)(this.state.extractMultiple.api.columns[idx].name);
      }
      const extractMultiple = merge(this.state.extractMultiple, {
        ui: {
          columns: this.state.extractMultiple.ui.columns.map(
            (column, index) => {
              const columnBis = column;
              if (idx === index) {
                columnBis.extract = extractColumn;
              }
              return columnBis;
            }
          ),
        },
      });
      this.setState({
        extractMultiple,
        transformation: this.state.transformation.setIn(
          ['args'],
          extractMultiple.ui
        ),
      });
    };
  }

  onSelectColumn(columns, columnName) {
    const column = filterByMultipleAndColumnName(columns, columnName);
    apiMultipleColumn(column, (apiRes) => {
      if (apiRes.error) {
        if (apiRes.error === 404) {
          this.setState({ error: 'extract_multiple_not_found_error' });
        } else {
          this.setState({ error: 'extract_multiple_global_error' });
        }
      } else {
        const apiResBis = apiRes;
        apiResBis.columnName = columnName;
        const ui = cloneDeep(apiResBis);
        delete ui.hasImage;
        ui.extractImage = false;
        ui.selectedColumn = column;

        this.setState({
          error: null,
          extractMultiple: {
            api: apiRes,
            ui,
          },
          transformation: this.state.transformation.setIn(['args'], ui),
        });
      }
    })
    .catch(() => {
      this.props.dispatch(showNotification('error', 'Failed to extract multiple.'));
    });
  }

  onExtractImage(value) {
    const extractMultiple = merge(this.state.extractMultiple, {
      ui: { extractImage: value },
    });
    this.setState({
      extractMultiple,
      transformation: this.state.transformation.setIn(
        ['args'],
        extractMultiple.ui
      ),
    });
  }

  onColumnName(idx) {
    return (columnName) => {
      const extractMultiple = merge(this.state.extractMultiple, {
        ui: {
          columns: this.state.extractMultiple.ui.columns.map((column, index) => {
            const columnBis = column;
            if (idx === index) {
              columnBis.name = columnName;
            }
            return columnBis;
          }),
        },
      });
      this.setState({
        extractMultiple,
        transformation: this.state.transformation.setIn(
          ['args'],
          extractMultiple.ui
        ),
      });
    };
  }

  isValidTransformation() {
    const {
      extractMultiple: {
        ui: { extractImage, columns, selectedColumn },
      },
    } = this.state;
    const extractColumns =
      columns.map(c => c.extract).filter(e => e).length !== 0;
    return selectedColumn && (extractImage || extractColumns);
  }

  render() {
    const { onClose, onApply, columns, intl } = this.props;
    const { extractMultiple: { ui: { selectedColumn } } } = this.state;
    const error = this.state.error;
    return (
      <div className="DataTableSidebar">
        <SidebarHeader onClose={onClose}>
          <FormattedMessage id="extract_multiple" />
        </SidebarHeader>
        <div className="inputs">
          <SelectColumn
            columns={columns}
            idx={1}
            onChange={columnName => this.onSelectColumn(columns, columnName)}
            value={selectedColumn.columnName}
            intl={intl}
          />
          { error ? <div className="feedbackMessage"><FormattedMessage id={error} /></div> : (
            <MultipleColumn
              api={this.state.extractMultiple.api}
              ui={this.state.extractMultiple.ui}
              selectedColumn={this.state.selectedColumn}
              onExtractImage={this.onExtractImage}
              extractImage={this.state.extractMultiple.ui.extractImage}
              onColumnName={this.onColumnName}
              onExtractColumn={this.onExtractColumn}
            />)}
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

ExtractMultiple.propTypes = {
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  intl: intlShape,
};

export default connect()(ExtractMultiple);
