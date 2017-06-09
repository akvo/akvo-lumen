import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SelectInput from './SelectInput';
import LabelInput from './LabelInput';
import Subtitle from './Subtitle';
import UniqueValueMenu from './UniqueValueMenu';
import ToggleInput from './ToggleInput';
import { canShowPivotTotals } from '../../../utilities/chart';

require('./PivotTableConfigMenu.scss');

const bug741fixed = false; // turn off unique value menus until this is fixed

// For now, we only support a subset of the regular aggregation options
const aggregationOptions = [
  {
    value: 'mean',
    label: 'mean',
  },
  {
    value: 'max',
    label: 'max',
  },
  {
    value: 'min',
    label: 'min',
  },
  {
    value: 'count',
    label: 'count',
  },
  {
    value: 'sum',
    label: 'sum',
  },
];

const getColumnTitle = (columnName, columnOptions = []) => {
  const entry = columnOptions.find(item => item.value === columnName);

  return entry ? entry.title : null;
};

const showValueDisplayInput = (spec) => {
  if (spec.aggregation !== 'count' && spec.aggregation !== 'sum') {
    return false;
  }

  if (spec.rowColumn === null || spec.categoryColumn === null) {
    return false;
  }

  return true;
};

export default class PivotTableConfigMenu extends Component {
  constructor() {
    super();
    this.state = {
      catValMenuCollapsed: true,
      rowValMenuCollapsed: true,
    };
  }

  render() {
    const {
      visualisation,
      onChangeSpec,
      columnOptions,
    } = this.props;
    const spec = visualisation.spec;

    return (
      <div className="PivotTableConfigMenu">
        <hr />
        <Subtitle>Aggregation</Subtitle>
        <div>
          <span
            className="aggregationInputContainer"
          >
            <SelectInput
              placeholder="Select aggregation method"
              labelText="Aggregation method"
              choice={spec.aggregation !== null ? spec.aggregation.toString() : null}
              name="aggregationMethod"
              options={aggregationOptions}
              disabled={spec.rowColumn == null || spec.categoryColumn == null}
              onChange={(value) => {
                const change = { aggregation: value };

                if (value === 'count') {
                  change.valueColumn = null;
                }
                onChangeSpec(change);
              }}
            />
            {spec.aggregation === 'count' &&
              (spec.rowColumn == null || spec.categoryColumn == null) &&
              <div
                className="helpText aggregationHelpText"
              >
                <div className="helpTextContainer">
                  <span className="alert">!</span>
                  Choose a column and a row to pivot on to use aggregations other than count.
                </div>
              </div>
            }
          </span>
          {spec.aggregation !== 'count' &&
            <div>
              <SelectInput
                placeholder="Select a value column"
                labelText="Value column"
                choice={spec.valueColumn !== null ? spec.valueColumn.toString() : null}
                name="valueColumnInput"
                options={columnOptions.filter(option =>
                  option.type === 'number' || option.type === 'date')}
                onChange={value => onChangeSpec({
                  valueColumn: value,
                })}
                clearable
              />
              <div className="inputGroup">
                <label htmlFor="decimalPlacesInput">
                  Number of decimal places
                </label>
                <input
                  className="numberInput"
                  id="decimalPlacesInput"
                  type="number"
                  value={spec.decimalPlaces}
                  min={0}
                  max={16}
                  onChange={evt => onChangeSpec({
                    decimalPlaces: evt.target.value,
                  })}
                />
              </div>
            </div>
          }
          {showValueDisplayInput(spec) &&
            <SelectInput
              placeholder="Choose how cells are displayed"
              labelText="Value display"
              choice={spec.valueDisplay ? spec.valueDisplay : 'default'}
              name="valueDisplay"
              options={[
                {
                  value: 'default',
                  label: 'Default',
                },
                {
                  value: 'percentageRow',
                  label: 'Cell as percentage of row',
                },
                {
                  value: 'percentageColumn',
                  label: 'Cell as percentage of column',
                },
                {
                  value: 'percentageTotal',
                  label: 'Cell as percentage of table total',
                },
              ]}
              onChange={value => onChangeSpec({
                valueDisplay: value,
              })}
            />
          }
          {canShowPivotTotals(spec) &&
            <div>
              <ToggleInput
                className="totalToggle"
                checked={spec.hideRowTotals !== true}
                label="Show row totals"
                onChange={() => onChangeSpec({
                  hideRowTotals: !spec.hideRowTotals,
                })}
              />
              <ToggleInput
                className="totalToggle"
                checked={spec.hideColumnTotals !== true}
                label="Show column totals"
                onChange={() => onChangeSpec({
                  hideColumnTotals: !spec.hideColumnTotals,
                })}
              />
            </div>
          }
        </div>
        <hr />
        <Subtitle>Columns</Subtitle>
        <SelectInput
          placeholder="Select a column"
          labelText="Columns"
          choice={spec.categoryColumn !== null ? spec.categoryColumn.toString() : null}
          name="categoryColumnInput"
          options={columnOptions}
          onChange={(value) => {
            const change = { categoryColumn: value };

            if (value == null && spec.aggregation !== 'count') {
              change.aggregation = 'count';
              change.valueColumn = null;
            }
            if (value !== spec.categoryColumn) {
              change.categoryTitle = null;
              change.filters = spec.filters.filter(filter => filter.origin !== 'pivot-column');
            }
            onChangeSpec(change);
          }}
          clearable
        />
        {spec.categoryColumn !== null &&
          <div>
            {bug741fixed &&
              <UniqueValueMenu
                tableData={visualisation.data}
                dimension="column"
                collapsed={this.state.catValMenuCollapsed}
                onChangeSpec={this.props.onChangeSpec}
                column={spec.categoryColumn}
                filters={spec.filters}
                toggleCollapsed={() =>
                  this.setState({ catValMenuCollapsed: !this.state.catValMenuCollapsed })
                }
              />
            }
            <LabelInput
              value={
                spec.categoryTitle == null ?
                  getColumnTitle(spec.categoryColumn, columnOptions)
                  :
                  spec.categoryTitle.toString()
              }
              placeholder="Columns title"
              name="categoryTitle"
              onChange={event => onChangeSpec({
                categoryTitle: event.target.value.toString(),
              })}
            />
          </div>
        }
        <hr />
        <Subtitle>Rows</Subtitle>
        <SelectInput
          placeholder="Select a row column"
          labelText="Row column"
          choice={spec.rowColumn !== null ? spec.rowColumn.toString() : null}
          name="rowColumnInput"
          options={columnOptions}
          onChange={(value) => {
            const change = { rowColumn: value };

            if (value == null && spec.aggregation !== 'count') {
              change.aggregation = 'count';
              change.valueColumn = null;
            }
            if (value !== spec.rowColumn) {
              change.rowTitle = null;
              change.filters = spec.filters.filter(filter => filter.origin !== 'pivot-row');
            }
            onChangeSpec(change);
          }}
          clearable
        />
        {spec.rowColumn !== null &&
          <div>
            {bug741fixed &&
              <UniqueValueMenu
                tableData={visualisation.data}
                dimension="row"
                collapsed={this.state.rowValMenuCollapsed}
                onChangeSpec={this.props.onChangeSpec}
                column={spec.rowColumn}
                filters={spec.filters}
                toggleCollapsed={() =>
                  this.setState({ rowValMenuCollapsed: !this.state.rowValMenuCollapsed })
                }
              />
            }
            <LabelInput
              value={
                spec.rowTitle == null ?
                  getColumnTitle(spec.rowColumn, columnOptions)
                  :
                  spec.rowTitle.toString()
              }
              placeholder="Row column title"
              name="rowTitle"
              onChange={event => onChangeSpec({
                rowTitle: event.target.value.toString(),
              })}
            />
          </div>
        }
      </div>
    );
  }
}

PivotTableConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  aggregationOptions: PropTypes.array.isRequired,
};
