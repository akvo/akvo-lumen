import React, { Component, PropTypes } from 'react';
import moment from 'moment';
import SelectMenu from '../../common/SelectMenu';

const operations = [
  {
    value: 'keep',
    label: 'Keep rows in which',
  },
  {
    value: 'remove',
    label: 'Remove rows in which',
  },
];

const strategies = {
  text: [
    {
      label: 'exactly matches',
      value: 'is',
    },
    {
      label: 'is empty',
      value: 'isEmpty',
    },
  ],
  number: [
    {
      label: 'is higher than',
      value: 'isHigher',
    },
    {
      label: 'exactly matches',
      value: 'is',
    },
    {
      label: 'is lower than',
      value: 'isLower',
    },
    {
      label: 'is empty',
      value: 'isEmpty',
    },
  ],
  date: [
    {
      label: 'is after',
      value: 'isHigher',
    },
    {
      label: 'is before',
      value: 'isLower',
    },
    {
      label: 'is empty',
      value: 'isEmpty',
    },
  ],
};

const getFilterOperationLabel =
  operation => operations.find(item => item.value.toString() === operation.toString()).label;

const getFilterStrategyLabel = (strategy, columnIndex, columnOptions) => {
  const columnType = columnOptions[columnIndex].type;
  const strat = strategies[columnType].find(item => item.value.toString() === strategy.toString());

  return strat.label;
};

const getFilterDisplayValue = (value, columnIndex, columnOptions) => {
  const columnType = columnOptions[columnIndex].type;
  let displayValue;

  if (columnType === 'date') {
    displayValue = moment.unix(value).format('YYYY-MM-DD hh:mm');
  } else {
    displayValue = value;
  }

  return displayValue;
};

export default class FilterMenu extends Component {
  constructor() {
    super();
    this.state = {
      inputInProgress: false,
      newFilterColumn: null,
      newFilterValue: null,
      newFilterOperation: null,
      newFilterStrategy: null,
    };

    this.toggleInput = this.toggleInput.bind(this);
    this.updateNewFilter = this.updateNewFilter.bind(this);
  }

  getIsFilterReady() {
    return Boolean(
      this.state.newFilterColumn &&
      this.state.newFilterOperation &&
      this.state.newFilterStrategy &&
      (this.state.newFilterValue || this.state.newFilterStrategy === 'isEmpty')
    );
  }

  toggleInput() {
    this.setState({
      inputInProgress: !this.state.inputInProgress,
    });
  }

  updateNewFilter(field, value, type) {
    let processedValue;
    if (type === 'date') {
      const inputDate = new Date(value);

      processedValue = Math.floor(inputDate.getTime() / 1000);
    } else {
      processedValue = value;
    }

    if (field === 'newFilterStrategy' && value === 'isEmpty') {
      this.setState({
        newFilterValue: null,
      });
    }

    this.setState({
      [field]: processedValue,
    });
  }

  saveFilter() {
    const filters = this.props.spec.filters.map(item => item);

    filters.push({
      column: this.state.newFilterColumn,
      columnType: this.props.columnOptions[this.state.newFilterColumn].type,
      value: this.state.newFilterValue,
      operation: this.state.newFilterOperation,
      strategy: this.state.newFilterStrategy,
    });
    this.props.onChangeSpec({
      filters,
    });
    this.setState({
      inputInProgress: false,
      newFilterColumn: null,
      newFilterValue: null,
      newFilterOperation: null,
      newFilterStrategy: null,
    });
  }

  deleteFilter(index) {
    const filters = this.props.spec.filters.map(item => item);

    filters.splice(index, 1);

    this.props.onChangeSpec({
      filters,
    });
  }

  render() {
    const { hasDataset, spec, columnOptions } = this.props;
    const { filters } = spec;
    const activeColumnType = this.state.newFilterColumn ?
      columnOptions[this.state.newFilterColumn].type : null;
    return (
      <div
        className={`FilterMenu inputGroup ${hasDataset ? 'enabled' : 'disabled'}`}
      >
        <h4>
          Dataset Filters
        </h4>
        <div className="container">
          {(!filters || filters.length === 0) ?
            <div className="noFilters">No filters</div> : <div className="filterListContainer">
              <ol className="filterList">
                {filters.map((filter, index) =>
                  <li
                    key={index}
                    className="filterListItem"
                  >
                    <span className="filterIndicator">
                      {getFilterOperationLabel(filter.operation)}
                    </span>
                    {' '}
                    <span>
                    rows where
                    </span>
                    {' '}
                    <span className="filterIndicator">
                      {columnOptions[filter.column].title}
                    </span>
                    {' '}
                    <span>
                      {getFilterStrategyLabel(filter.strategy, filter.column, columnOptions)}
                    </span>
                    {' '}
                    <span className="filterIndicator">
                      {getFilterDisplayValue(filter.value, filter.column, columnOptions)}
                    </span>
                    <button
                      className="deleteFilter clickable"
                      onClick={() => this.deleteFilter(index)}
                    >
                    +
                    </button>
                  </li>
              )}
              </ol>
            </div>
          }
          {this.state.inputInProgress ?
            <div className="newFilterContainer">
              <h4>New Filter</h4>
              <div className="inputGroup">
                <div className="filterBodyContainer">
                  <label htmlFor="filterOperationInput">
                    Filter operation
                  </label>
                  <SelectMenu
                    className="filterOperationInput"
                    name="filterOperationInput"
                    placeholder="Choose a filter operation..."
                    value={this.state.newFilterOperation || null}
                    options={operations}
                    onChange={choice => this.updateNewFilter('newFilterOperation', choice)}
                  />
                  <label htmlFor="filterColumnInput">
                    Column to filter by:
                  </label>
                  <SelectMenu
                    className="filterColumnInput"
                    name="filterColumnInput"
                    placeholder="Choose a column to filter by..."
                    value={this.state.newFilterColumn || null}
                    options={columnOptions}
                    onChange={choice => this.updateNewFilter('newFilterColumn', choice)}
                  />
                  <label htmlFor="filterStrategyInput">
                    Filter match method
                  </label>
                  <SelectMenu
                    className={`filterStrategyInput
                      ${this.state.newFilterColumn ? 'enabled' : 'disabled'}`}
                    disabled={this.state.newFilterColumn === null}
                    name="filterStrategyInput"
                    placeholder="Choose a match method..."
                    value={this.state.newFilterStrategy || null}
                    options={this.state.newFilterColumn ? strategies[activeColumnType] : []}
                    onChange={choice => this.updateNewFilter('newFilterStrategy', choice)}
                  />
                  <label htmlFor="filterMatchValueInput">
                    Filter match value
                  </label>
                  <input
                    className={`filterMatchValueInput textInput
                      ${this.state.newFilterColumn ? 'enabled' : 'disabled'}`}
                    disabled={
                      this.state.newFilterColumn === null
                      || this.state.newFilterStrategy === 'isEmpty'
                    }
                    type={this.state.newFilterColumn ? activeColumnType : 'text'}
                    onChange={evt =>
                      this.updateNewFilter('newFilterValue', evt.target.value, activeColumnType)}
                  />
                </div>
              </div>
              <div className="buttonContainer">
                <button
                  className={`saveFilter clickable
                    ${this.getIsFilterReady() ? 'enabled' : 'disabled'}`}
                  onClick={() => this.saveFilter()}
                >
                  Save Filter
                </button>
                <button
                  className="cancelFilter clickable"
                  onClick={() => this.toggleInput()}
                >
                  Cancel
                </button>
              </div>
            </div> : <div className="addFilterContainer">
              <button
                className={`addFilter clickable
                ${hasDataset ? 'enabled' : 'disabled noPointerEvents'}`}
                onClick={() => this.toggleInput()}
              >
              Add New Filter
              </button>
            </div>
          }
        </div>
      </div>
    );
  }
}

FilterMenu.propTypes = {
  spec: PropTypes.object.isRequired,
  hasDataset: PropTypes.bool.isRequired,
  columnOptions: PropTypes.array.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};
