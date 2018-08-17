import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { FormattedMessage } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';
import ToggleInput from '../../common/ToggleInput';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import * as api from '../../../api';
import * as _ from 'lodash';

function textColumnOptions(columns) {
  return columns
    .filter(column => column.get('type') === 'multiple')
    .map(column => ({
      label: column.get('title'),
      value: column.get('columnName'),
    }))
    .toJS();
}

function filterByMultipleAndColumnName(columns, columnName) {
  return columns
    .filter(
      column =>
        column.get('type') === 'multiple' &&
        column.get('columnName') === columnName,
    )
    .toJS()[0];
}

function SelectColumn({ columns, idx, onChange, value }) {
  return (
    <div className="inputGroup">
      <label htmlFor="columnName">
        <FormattedMessage id="select_n_column" values={{ idx }} />
      </label>
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

class MultipleColumnImage extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { hasImage, extractImage, onExtractImage } = this.props;
    if (hasImage) {
      return (
        <ToggleInput
          name="image"
          type="checkbox"
          labelId="extract_image_question"
          className="showLegend"
          checked={extractImage}
          onChange={onExtractImage}
        />
      );
    }
    return null;
  }
}

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
    const api = this.props.api; // .name; type id
    const ui = this.props.ui;
    return (
      <div className="inputs">
        <div className="inputGroup">
          <div>
            <FormattedMessage id="extract_column_question" />
            {ui.extract ? (
              undefined
            ) : (
              <div>
                {' '}
                {api.name} :: {api.type}
              </div>
            )}
            <ToggleInput
              name="extractColumn"
              type="checkbox"
              className="showLegend"
              checked={ui.extract}
              onChange={this.props.onExtractColumn}
            />
          </div>
          {ui.extract ? (
            <input
              value={ui.name}
              placeholder={api.name} // TODO: how to i18n this value?
              type="text"
              className="titleTextInput"
              onChange={this.onColumnName}
              data-test-id={'column-title-' + api.id}
            />
          ) : (
            undefined
          )}
        </div>
      </div>
    );
  }
}

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
  return <div>{columList}</div>;
}

function MultipleColumn(props) {
  const {
    api,
    ui,
    onExtractImage,
    extractImage,
    onColumnName,
    onExtractColumn,
  } = props;
  return api ? (
    <div>
      <MultipleColumnImage
        hasImage={api.hasImage}
        extractImage={ui.extractImage}
        onExtractImage={onExtractImage}
        extractImage={extractImage}
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

export default class ExtractMultiple extends Component {
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

  isValidTransformation() {
    const {
      transformation,

      extractMultiple: {
        ui: { extractImage, columns, selectedColumn },
      },
    } = this.state;
    const extractColumns =
      columns.map(c => c.extract).filter(e => e).length != 0;
    console.log(this.state);
    console.log('selectedColumn', selectedColumn);
    console.log('extractImage', extractImage);
    console.log('columns', columns);
    console.log('extractColumns', extractColumns);

    //    return transformation.getIn(['args', 'columnName']) !== '';
    console.log('transformation', transformation);
    return selectedColumn && (extractImage || extractColumns);
  }

  apiMultipleColumn(column, callback) {
    api
      .get('/api/multiple-column', {
        query: JSON.stringify({
          subtype: column.subtype,
          subtypeId: column.subtypeId,
        }),
      })
      .then(response => response.json())
      .then(callback);
  }

  onExtractColumn(idx) {
    return extractColumn => {
      if (!extractColumn) {
        this.onColumnName(idx)(
          this.state.extractMultiple.api.columns[idx].name,
        );
      }
      const extractMultiple = _.merge(this.state.extractMultiple, {
        ui: {
          columns: this.state.extractMultiple.ui.columns.map(
            (column, index) => {
              if (idx === index) {
                column.extract = extractColumn;
              }
              return column;
            },
          ),
        },
      });
      this.setState({
        extractMultiple: extractMultiple,
        transformation: this.state.transformation.setIn(
          ['args'],
          extractMultiple.ui,
        ),
      });
      //      console.log(this.state.extractMultiple.ui.columns[idx].extract);
    };
  }

  onSelectColumn(columns, columnName) {
    const column = filterByMultipleAndColumnName(columns, columnName);
    this.apiMultipleColumn(column, apiRes => {
      const ui = _.cloneDeep(apiRes); // cloning object
      delete ui.hasImage;
      ui.extractImage = false;
      ui.selectedColumn = column;

      this.setState({
        extractMultiple: {
          api: apiRes,
          ui: ui,
        },
        transformation: this.state.transformation.setIn(['args'], ui),
      });
    });
  }

  onExtractImage(value) {
    const extractMultiple = _.merge(this.state.extractMultiple, {
      ui: { extractImage: value },
    });
    this.setState({
      extractMultiple: extractMultiple,
      transformation: this.state.transformation.setIn(
        ['args'],
        extractMultiple.ui,
      ),
    });
  }

  onColumnName(idx) {
    return columnName => {
      const extractMultiple = _.merge(this.state.extractMultiple, {
        ui: {
          columns: this.state.extractMultiple.ui.columns.map(
            (column, index) => {
              if (idx === index) {
                column.name = columnName;
              }
              return column;
            },
          ),
        },
      });
      this.setState({
        extractMultiple: extractMultiple,
        transformation: this.state.transformation.setIn(
          ['args'],
          extractMultiple.ui,
        ),
      });
      //      console.log(this.state.extractMultiple.ui.columns[idx].name);
    };
  }

  render() {
    const { onClose, onApply, columns } = this.props;
    const args = this.state.transformation.get('args');
    const selectedColumn = this.state.extractMultiple.ui.selectedColumn;
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
          />
          <MultipleColumn
            api={this.state.extractMultiple.api}
            ui={this.state.extractMultiple.ui}
            selectedColumn={this.state.selectedColumn}
            onExtractImage={this.onExtractImage}
            extractImage={this.state.extractMultiple.ui.extractImage}
            onColumnName={this.onColumnName}
            onExtractColumn={this.onExtractColumn}
          />
        </div>

        <SidebarControls
          positiveButtonText={<FormattedMessage id="extract" />}
          onApply={
            this.isValidTransformation()
              ? () => onApply(this.state.transformation)
              : null
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
};
//    const { transformation } = this.state;
//
