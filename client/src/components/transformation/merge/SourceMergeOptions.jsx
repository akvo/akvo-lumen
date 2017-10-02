import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ensureDatasetFullyLoaded } from '../../../actions/dataset';
import SelectDataset from './SelectDataset';
import SelectColumn from './SelectColumn';
import SelectMenu from '../../common/SelectMenu';
import './SourceMergeOptions.scss';

function SelectKeyColumn({ onChange, columns, keyColumn }) {
  return (
    <div>
      <h1>Key column</h1>
      <SelectColumn
        placeholder="Select key column"
        columns={columns}
        value={keyColumn}
        onChange={onChange}
      />
    </div>
  );
}

SelectKeyColumn.propTypes = {
  onChange: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
  keyColumn: PropTypes.object,
};

function directionLabels(column) {
  const defaultLabels = { asc: 'first', desc: 'last' };
  if (column == null) return defaultLabels;
  switch (column.get('type')) {
    case 'date': return { asc: 'earliest', desc: 'latest' };
    case 'number': return { asc: 'lowest', desc: 'highest' };
    default: return defaultLabels;
  }
}

function SelectOrderBy({ orderByColumn, direction, dataset, onChangeColumn, onChangeDirection }) {
  const { asc, desc } = directionLabels(orderByColumn);
  return (
    <div className="SelectOrderBy">
      <h1>In case of conflict, select values according to</h1>
      <div className="orderByContainer">
        <span className="orderByColumn">
          <SelectColumn
            placeholder="Select conflict resolution column"
            columns={dataset.get('columns')}
            value={orderByColumn}
            onChange={onChangeColumn}
          />
        </span>
        {orderByColumn != null &&
          <span className="direction">
            <SelectMenu
              options={[
                { label: asc, value: 'ASC' },
                { label: desc, value: 'DESC' },
              ]}
              value={direction}
              onChange={onChangeDirection}
            />
          </span>
        }
      </div>
    </div>
  );
}

SelectOrderBy.propTypes = {
  orderByColumn: PropTypes.object,
  direction: PropTypes.string.isRequired,
  dataset: PropTypes.object.isRequired,
  onChangeColumn: PropTypes.func.isRequired,
  onChangeDirection: PropTypes.func.isRequired,
};

function SelectMergeColumns({ onChange, columns, selected }) {
  return (
    <fieldset>
      <legend><h1>Choose which columns to merge ({selected.length} / {columns.size})</h1></legend>
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
              selected={selected.includes(column)}
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
  columns: PropTypes.object.isRequired,
  selected: PropTypes.array,
};

function guessKeyColumn(dataset) {
  const columns = dataset.get('columns').filter(column => column.get('key'));
  if (columns.size === 1) {
    return columns.get(0);
  }
  return columns.find(column => column.get('columnName') === 'identifier');
}

class SourceMergeOptions extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loadingDataset: false,
      dataset: null,
      keyColumn: null,
      orderByColumn: null,
      direction: 'DESC',
      mergeColumns: [],
    };
  }

  handleSelectDataset(dataset) {
    const { dispatch, onChange } = this.props;
    const { direction } = this.state;

    this.setState({ loadingDataset: true });
    const id = dataset.get('id');
    dispatch(ensureDatasetFullyLoaded(id))
      .then((ds) => {
        const guessedKeyColumn = guessKeyColumn(ds);
        this.setState({
          loadingDataset: false,
          dataset: ds,
          keyColumn: guessedKeyColumn,
          orderByColumn: null,
          direction: 'DESC',
          mergeColumns: [],
        });
        onChange({
          datasetId: ds.get('id'),
          keyColumn: guessedKeyColumn == null ? null : guessedKeyColumn.get('columnName'),
          orderByColumn: null,
          direction,
          mergeColumns: [],
        });
      });
  }

  handleSelectKeyColumn(column) {
    const { onChange } = this.props;
    const { dataset, mergeColumns, orderByColumn, direction } = this.state;

    this.setState({ keyColumn: column });
    onChange({
      datasetId: dataset.get('id'),
      keyColumn: column.get('columnName'),
      orderByColumn: orderByColumn == null ? null : orderByColumn.get('columnName'),
      direction,
      mergeColumns: mergeColumns.map(col => col.get('columnName')),
    });
  }

  handleSelectOrderByColumn(column) {
    const { onChange } = this.props;
    const { dataset, keyColumn, mergeColumns, direction } = this.state;

    this.setState({ orderByColumn: column });
    onChange({
      datasetId: dataset.get('id'),
      keyColumn: keyColumn.get('columnName'),
      orderByColumn: column.get('columnName'),
      direction,
      mergeColumns: mergeColumns.map(col => col.get('columnName')),
    });
  }

  handleSelectDirection(direction) {
    const { onChange } = this.props;
    const { dataset, keyColumn, mergeColumns, orderByColumn } = this.state;

    this.setState({ direction });
    onChange({
      datasetId: dataset.get('id'),
      keyColumn: keyColumn.get('columnName'),
      orderByColumn: orderByColumn.get('columnName'),
      direction,
      mergeColumns: mergeColumns.map(col => col.get('columnName')),
    });
  }

  handleToggleMergeColumn(column) {
    const { onChange } = this.props;
    const { mergeColumns, keyColumn, orderByColumn, direction, dataset } = this.state;

    const newMergeColumns = mergeColumns.includes(column) ?
      mergeColumns.filter(col => col !== column) :
      [column, ...mergeColumns];

    this.setState({
      mergeColumns: newMergeColumns,
    });

    onChange({
      datasetId: dataset.get('id'),
      keyColumn: keyColumn.get('columnName'),
      orderByColumn: orderByColumn == null ? null : orderByColumn.get('columnName'),
      direction,
      mergeColumns: newMergeColumns.map(col => col.get('columnName')),
    });
  }

  render() {
    const { datasets } = this.props;
    const {
      dataset,
      loadingDataset,
      keyColumn,
      mergeColumns,
      orderByColumn,
      direction,
    } = this.state;

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
          <SelectKeyColumn
            columns={dataset.get('columns')}
            keyColumn={keyColumn}
            onChange={column => this.handleSelectKeyColumn(column)}
          />
        }
        {keyColumn != null && !keyColumn.get('key') &&
          <SelectOrderBy
            onChangeColumn={column => this.handleSelectOrderByColumn(column)}
            onChangeDirection={dir => this.handleSelectDirection(dir)}
            orderByColumn={orderByColumn}
            direction={direction}
            dataset={dataset}
          />
        }
        {keyColumn != null &&
          <SelectMergeColumns
            columns={dataset.get('columns')}
            selected={mergeColumns}
            onChange={column => this.handleToggleMergeColumn(column)}
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
