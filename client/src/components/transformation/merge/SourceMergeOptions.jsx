import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { connect } from 'react-redux';
import { ensureDatasetFullyLoaded } from '../../../actions/dataset';
import SelectDataset from './SelectDataset';
import SelectColumn from '../SelectColumn';
import SelectMenu from '../../common/SelectMenu';
import { guessMergeColumn, getColumnName, directionLabels } from './utils';
import './SourceMergeOptions.scss';

function SelectMergeColumn({ onChange, columns, mergeColumn }) {
  return (
    <div>
      <h1>Merge column</h1>
      <SelectColumn
        placeholder="Select key column"
        columns={columns}
        value={mergeColumn}
        onChange={onChange}
      />
    </div>
  );
}

SelectMergeColumn.propTypes = {
  onChange: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
  mergeColumn: PropTypes.object,
};

function SelectAggregation({
  aggregationColumn,
  aggregationDirection,
  dataset,
  onChangeColumn,
  onChangeDirection,
}) {
  const { asc, desc } = directionLabels(aggregationColumn);
  return (
    <div className="SelectAggregation">
      <h1>Aggregation strategy</h1>
      <div className="aggregationContainer">
        <span className="aggregationColumn">
          <SelectColumn
            placeholder="Select aggregation column"
            showColumnType
            columns={dataset.get('columns')}
            value={aggregationColumn}
            onChange={onChangeColumn}
          />
        </span>
        {aggregationColumn != null &&
          <span className="aggregationDirection">
            <SelectMenu
              options={[
                { label: asc, value: 'ASC' },
                { label: desc, value: 'DESC' },
              ]}
              value={aggregationDirection}
              onChange={onChangeDirection}
            />
          </span>
        }
      </div>
    </div>
  );
}

SelectAggregation.propTypes = {
  aggregationColumn: PropTypes.object,
  aggregationDirection: PropTypes.string.isRequired,
  dataset: PropTypes.object.isRequired,
  onChangeColumn: PropTypes.func.isRequired,
  onChangeDirection: PropTypes.func.isRequired,
};

function SelectMergeColumns({ onChange, onChangeAll, columns, selected }) {
  const selectedNames = selected.map(o => o.get('columnName'));
  const allSelected = selected.size === columns.size;
  return (
    <fieldset>
      <legend><h1>Choose which columns to merge ({selected.size} / {columns.size})</h1>
        <fieldset style={{ boderColor: '#EEEEEE', backgroundColor: allSelected ? '#EEEEEE' : '#FFFFFF' }}>
          <input
            type="checkbox"
            name="all_checks"
            value="yupie"
            checked={allSelected}
            onChange={onChangeAll}
          />
          {selected.size === columns.size ? 'All columns selected' : 'Select all Columns'}
        </fieldset>
      </legend>
      {columns.map((column) => {
        const columnName = column.get('columnName');

        const id = `merge_column_${columnName}`;
        return (
          <div key={columnName}>
            <input
              type="checkbox"
              id={id}
              name="merge_column"
              value={columnName}
              selected={selectedNames.includes(columnName)}
              checked={selectedNames.includes(columnName)}
              onChange={() => onChange(column)}
            />
            <label htmlFor={id}>{column.get('title')}</label>
          </div>
        );
      })}
    </fieldset>
  );
}

SelectMergeColumns.propTypes = {
  onChange: PropTypes.func.isRequired,
  onChangeAll: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
  selected: PropTypes.object.isRequired,
};

class SourceMergeOptions extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loadingDataset: false,
      dataset: null,
      mergeColumn: null,
      aggregationColumn: null,
      aggregationDirection: 'DESC',
      mergeColumns: Immutable.List(),
    };
  }

  handleSelectDataset(dataset) {
    const { dispatch, onChange } = this.props;
    const { aggregationDirection } = this.state;

    this.setState({ loadingDataset: true });
    const id = dataset.get('id');
    dispatch(ensureDatasetFullyLoaded(id))
      .then((ds) => {
        // Preselect sensible defaults for Flow datasets
        const guessedMergeColumn = guessMergeColumn(ds);
        const guessedAggregationColumn = guessedMergeColumn != null && !guessedMergeColumn.get('key') ?
          ds.get('columns').find(column => column.get('columnName') === 'submitted_at') : null;

        this.setState({
          loadingDataset: false,
          dataset: ds,
          mergeColumn: guessedMergeColumn,
          aggregationColumn: guessedAggregationColumn,
          direction: 'DESC',
          mergeColumns: Immutable.List(),
        });

        onChange({
          datasetId: ds.get('id'),
          mergeColumn: getColumnName(guessedMergeColumn),
          aggregationColumn: getColumnName(guessedAggregationColumn),
          aggregationDirection,
          mergeColumns: Immutable.List(),
        });
      });
  }

  handleSelectMergeColumn(column) {
    const { onChange } = this.props;
    const { dataset, mergeColumns, aggregationColumn, aggregationDirection } = this.state;

    this.setState({ mergeColumn: column });
    onChange({
      datasetId: dataset.get('id'),
      mergeColumn: column.get('columnName'),
      aggregationColumn: getColumnName(aggregationColumn),
      aggregationDirection,
      mergeColumns: mergeColumns.map(col => col.get('columnName')),
    });
  }

  handleSelectAggregationColumn(column) {
    const { onChange } = this.props;
    const { dataset, mergeColumn, mergeColumns, aggregationDirection } = this.state;

    this.setState({ aggregationColumn: column });
    onChange({
      datasetId: dataset.get('id'),
      mergeColumn: mergeColumn.get('columnName'),
      aggregationColumn: column.get('columnName'),
      aggregationDirection,
      mergeColumns: mergeColumns.map(col => col.get('columnName')),
    });
  }

  handleSelectAggregationDirection(aggregationDirection) {
    const { onChange } = this.props;
    const { dataset, mergeColumn, mergeColumns, aggregationColumn } = this.state;

    this.setState({ aggregationDirection });
    onChange({
      datasetId: dataset.get('id'),
      mergeColumn: mergeColumn.get('columnName'),
      aggregationColumn: aggregationColumn.get('columnName'),
      aggregationDirection,
      mergeColumns: mergeColumns.map(col => col.get('columnName')),
    });
  }

  handleToggleMergeColumn(column) {
    const { onChange } = this.props;
    const {
      mergeColumns,
      mergeColumn,
      aggregationColumn,
      aggregationDirection,
      dataset } = this.state;
    const newMergeColumns = mergeColumns.includes(column) ?
      mergeColumns.filter(col => col !== column) :
      mergeColumns.push(column);

    this.setState({
      mergeColumns: newMergeColumns,
    });

    onChange({
      datasetId: dataset.get('id'),
      mergeColumn: mergeColumn.get('columnName'),
      aggregationColumn: getColumnName(aggregationColumn),
      aggregationDirection,
      mergeColumns: newMergeColumns.map(col => col.get('columnName')),
    });
  }

  handleToggleAllColumns(columns) {
    const { onChange } = this.props;
    const {
      mergeColumn,
      aggregationColumn,
      aggregationDirection,
      dataset } = this.state;
    const newMergeColumns = columns;
    this.setState({
      mergeColumns: columns,
    });

    onChange({
      datasetId: dataset.get('id'),
      mergeColumn: mergeColumn.get('columnName'),
      aggregationColumn: getColumnName(aggregationColumn),
      aggregationDirection,
      mergeColumns: newMergeColumns.map(col => col.get('columnName')),
    });
  }

  render() {
    const { datasets } = this.props;
    const {
      dataset,
      loadingDataset,
      mergeColumn,
      mergeColumns,
      aggregationColumn,
      aggregationDirection,
    } = this.state;
    const columns = dataset ? dataset.get('columns').filter(col => col !== mergeColumn) : Immutable.List();
    return (
      <div className="SourceMergeOptions">
        <h1>Dataset 2</h1>
        <SelectDataset
          placeholder="Select dataset"
          datasets={datasets}
          onChange={ds => this.handleSelectDataset(ds)}
          value={dataset}
        />
        {dataset != null && !loadingDataset &&
          <SelectMergeColumn
            columns={dataset.get('columns')}
            mergeColumn={mergeColumn}
            onChange={column => this.handleSelectMergeColumn(column)}
          />
        }
        {mergeColumn != null && !mergeColumn.get('key') &&
          <SelectAggregation
            onChangeColumn={column => this.handleSelectAggregationColumn(column)}
            onChangeDirection={dir => this.handleSelectAggregationDirection(dir)}
            aggregationColumn={aggregationColumn}
            aggregationDirection={aggregationDirection}
            dataset={dataset}
          />
        }
        {mergeColumn != null &&
          <SelectMergeColumns
            columns={columns}
            selected={mergeColumns}
            onChange={column => this.handleToggleMergeColumn(column)}
            onChangeAll={() => this.handleToggleAllColumns(columns)}
          />
        }
      </div>
    );
  }
}

SourceMergeOptions.propTypes = {
  dispatch: PropTypes.func.isRequired,
  datasets: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

// Inject dispatch only
export default connect()(SourceMergeOptions);
