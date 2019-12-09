import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { get } from 'lodash';
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';

import Button from '../../common/Button';
import SelectMenu from '../../common/SelectMenu';
import { filterColumns } from '../../../utilities/column';
import './FilterMenu.scss';

const getMenuFilters = filterArray =>
  filterArray.filter(item => item.origin !== 'pivot-row' && item.origin !== 'pivot-column');

const getFilterOperationLabel = operations => operation =>
  operations.find(item => item.value.toString() === operation.toString()).label;

const getColumnTitle = (columnOptions, filter) => {
  const columnInFilter = filter.column;
  const matchingColumn = columnOptions.find(col => col.value === columnInFilter);
  const columnTitle = get(matchingColumn, 'title') || null;

  return columnTitle;
};

const getFilterStrategyLabel = (strategy, columnName, columnOptions, strategies) => {
  const columnType = get(columnOptions.find(col => col.value === columnName), 'type');
  if (!columnType) {
    return null;
  }
  const strat = strategies[columnType].find(item => item.value.toString() === strategy.toString());

  return strat ? strat.label : null;
};

const getFilterDisplayValue = (value, columnName, columnOptions) => {
  const column = columnOptions.find(col => col.value === columnName);
  if (!column) {
    return value;
  }
  const columnType = column.type;
  let displayValue;

  if (columnType === 'date') {
    const secondsToMilliseconds = 1000;

    displayValue = moment(parseInt(value, 10) * secondsToMilliseconds).format('YYYY-MM-DD');
  } else {
    displayValue = value;
  }

  return displayValue;
};

const isFilterValid = (filter, columnOptions, strategies) => {
  if (!getColumnTitle(columnOptions, filter)) {
    return false;
  }

  const columnType = columnOptions.find(col => col.value === filter.column).type;
  const filterStrategy = get(filter, 'strategy') || '';
  const stratValid = Boolean(
    strategies[columnType].find(item => item.value.toString() === filterStrategy.toString())
  );

  return stratValid;
};

class FilterMenu extends Component {

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

  getDropdownOptions() {
    const { formatMessage } = this.props.intl;
    return {
      operations: [
        {
          value: 'keep',
          label: formatMessage({ id: 'keep_rows_in_which' }),
        },
        {
          value: 'remove',
          label: formatMessage({ id: 'remove_rows_in_which' }),
        },
      ],

      strategies: {
        text: [
          {
            label: formatMessage({ id: 'exactly_matches' }),
            value: 'is',
          },
          {
            label: formatMessage({ id: 'is_empty' }),
            value: 'isEmpty',
          },
        ],
        number: [
          {
            label: formatMessage({ id: 'is_higher_than' }),
            value: 'isHigher',
          },
          {
            label: formatMessage({ id: 'exactly_matches' }),
            value: 'is',
          },
          {
            label: formatMessage({ id: 'is_lower_than' }),
            value: 'isLower',
          },
          {
            label: formatMessage({ id: 'is_empty' }),
            value: 'isEmpty',
          },
        ],
        date: [
          {
            label: formatMessage({ id: 'is_after' }),
            value: 'isHigher',
          },
          {
            label: formatMessage({ id: 'is_before' }),
            value: 'isLower',
          },
          {
            label: formatMessage({ id: 'is_empty' }),
            value: 'isEmpty',
          },
        ],
      },
    };
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
    const { columnOptions } = this.props;
    const { newFilterColumn, newFilterValue, newFilterOperation, newFilterStrategy } = this.state;
    const rawFilters = this.props.filters.slice(0);

    rawFilters.push({
      column: newFilterColumn,
      columnType: columnOptions.find(col => col.value === newFilterColumn).type,
      value: newFilterValue,
      operation: newFilterOperation,
      strategy: newFilterStrategy,
      origin: 'filterMenu',
    });

    this.props.onChangeSpec({
      filters: rawFilters,
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
    const filters = getMenuFilters(this.props.filters);
    const delFilter = filters[index];
    const rawFilters = this.props.filters; // Raw filter array, including filters from other origins

    const filterIndex = rawFilters.findIndex(entry => Boolean(
      entry.column === delFilter.column &&
      entry.value === delFilter.value &&
      entry.operation === delFilter.operation &&
      entry.strategy === delFilter.strategy &&
      entry.origin === delFilter.origin
    ));

    if (filterIndex === -1) {
      throw new Error(`Cannot delete filter ${delFilter} as it does not appear in spec.filters`);
    } else {
      rawFilters.splice(filterIndex, 1);

      this.props.onChangeSpec({
        filters: rawFilters,
      });
    }
  }

  toggleInput() {
    this.setState({
      inputInProgress: !this.state.inputInProgress,
    });
  }

  render() {
    const { hasDataset, columnOptions, intl } = this.props;
    const { formatMessage } = intl;
    const filters = getMenuFilters(this.props.filters);
    const {
      newFilterColumn,
      newFilterStrategy,
      newFilterOperation,
      inputInProgress,
    } = this.state;
    const activeColumnType = newFilterColumn ?
      columnOptions.find(col => col.value === newFilterColumn).type : null;
    const { operations, strategies } = this.getDropdownOptions();

    const isFilterReady = this.getIsFilterReady();

    return (
      <div className={`FilterMenu inputGroup ${hasDataset ? 'enabled' : 'disabled'}`}>
        <div>
          <div className="container">
            {(!filters || filters.length === 0) ? (
              <div className="noFilters">No filters</div>
            ) : (
              <div className="filterListContainer">
                <ol className="filterList">
                  {filters.map((filter, index) => (
                    isFilterValid(filter, columnOptions, strategies) ? (
                      <li
                        key={index}
                        className="filterListItem valid"
                      >
                        <span className="filterIndicator">
                          {getFilterOperationLabel(operations)(filter.operation)}
                        </span>
                        {' '}
                        <span />
                        {' '}
                        <span className="filterIndicator">
                          {getColumnTitle(columnOptions, filter)}
                        </span>
                        {' '}
                        <span>
                          {getFilterStrategyLabel(
                            filter.strategy,
                            filter.column,
                            columnOptions,
                            strategies
                          )}
                        </span>
                        {' '}
                        <span className="filterIndicator">
                          {getFilterDisplayValue(filter.value, filter.column, columnOptions)}
                        </span>
                        <button
                          className="deleteFilter clickable"
                          onClick={() => this.deleteFilter(index)}
                        >
                        ✕
                        </button>
                      </li>
                    ) : (
                      <li
                        key={index}
                        className="filterListItem invalid"
                      >
                        <span className="filterIndicator">
                          {
                            getColumnTitle(columnOptions, filter) ? (
                              <span>
                                The type of column {getColumnTitle(columnOptions, filter)} has
                                changed and this filter is no longer valid. Please delete it.
                              </span>
                            ) : (
                              <span>
                                A column this filter refers to no longer exists.
                                Please delete this filter.
                              </span>
                            )
                          }
                        </span>
                        <button
                          className="deleteFilter clickable"
                          onClick={() => this.deleteFilter(index)}
                        >
                        ✕
                        </button>
                      </li>
                    )
                  ))}
                </ol>
              </div>
            )}
            {inputInProgress && (
              <div className="newFilterContainer">
                <h4>
                  <FormattedMessage id="new_filter" />
                </h4>
                <div className="inputGroup">
                  <div className="filterBodyContainer">
                    <label htmlFor="filterOperationInput">
                      <FormattedMessage id="filter_operation" />
                    </label>
                    <SelectMenu
                      className="filterOperationInput"
                      name="filterOperationInput"
                      placeholder={`${formatMessage({ id: 'choose_a_filter_operation' })}...`}
                      value={newFilterOperation || null}
                      options={operations}
                      onChange={choice => this.updateNewFilter('newFilterOperation', choice)}
                    />
                    <label htmlFor="filterColumnInput">
                      <FormattedMessage id="column_filter_by" />
                    </label>
                    <SelectMenu
                      className="filterColumnInput"
                      name="filterColumnInput"
                      placeholder={`${formatMessage({ id: 'choose_a_column_to_filter_by' })}...`}
                      value={newFilterColumn || null}
                      options={filterColumns(columnOptions, ['text', 'number', 'date'])}
                      onChange={choice => this.updateNewFilter('newFilterColumn', choice)}
                    />
                    <label htmlFor="filterStrategyInput">
                      <FormattedMessage id="filter_match_method" />
                    </label>
                    <SelectMenu
                      className={`filterStrategyInput
                        ${newFilterColumn ? 'enabled' : 'disabled'}`}
                      disabled={newFilterColumn === null}
                      name="filterStrategyInput"
                      placeholder={`${formatMessage({ id: 'choose_a_match_method' })}...`}
                      value={newFilterStrategy || null}
                      options={newFilterColumn ? strategies[activeColumnType] : []}
                      onChange={choice => this.updateNewFilter('newFilterStrategy', choice)}
                    />
                    <label htmlFor="filterMatchValueInput">
                      <FormattedMessage id="filter_match_value" />
                    </label>
                    <input
                      className={`filterMatchValueInput textInput
                        ${newFilterColumn ? 'enabled' : 'disabled'}`}
                      disabled={newFilterColumn === null || newFilterStrategy === 'isEmpty'}
                      type={newFilterColumn ? activeColumnType : 'text'}
                      onChange={evt =>
                        this.updateNewFilter('newFilterValue', evt.target.value, activeColumnType)}
                    />
                  </div>
                </div>
                <div className="buttonContainer">
                  <Button
                    className={'saveFilter clickable'}
                    disabled={!isFilterReady}
                    onClick={() => this.saveFilter()}
                    success
                  >
                    <FormattedMessage id="save_filter" />
                  </Button>
                  <Button
                    className="cancelFilter clickable"
                    onClick={() => this.toggleInput()}
                    danger
                  >
                    <FormattedMessage id="cancel" />
                  </Button>
                </div>
              </div>
            )}
            {!inputInProgress && (
              <Button onClick={this.toggleInput} primary>
                <i className="fa fa-plus" aria-hidden="true" />
                &nbsp;
                <FormattedMessage id="new_filter" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

FilterMenu.propTypes = {
  intl: intlShape,
  filters: PropTypes.array.isRequired,
  hasDataset: PropTypes.bool.isRequired,
  columnOptions: PropTypes.array.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};

export default injectIntl(FilterMenu);
