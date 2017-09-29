import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ensureDatasetFullyLoaded } from '../../../actions/dataset';
import SelectDataset from './SelectDataset';
import SelectColumn from './SelectColumn';
import SelectMenu from '../../common/SelectMenu';
import './SourceMergeOptions.scss';


function KeyColumnSelector({ onChange, columns, keyColumn }) {
  return (
    <div>
      <h1>Key column</h1>
      <SelectColumn
        columns={columns}
        placeholder="Select key column"
        value={keyColumn}
        onChange={onChange}
      />
    </div>
  );
}

KeyColumnSelector.propTypes = {
  onChange: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
  keyColumn: PropTypes.object,
};

function OrderByColumnSelector({ onChange, columns, orderByColumn }) {
  return (
    <div>
      <h1>In case of conflict, select values according to</h1>
      <SelectColumn
        columns={columns}
        placeholder="Select conflict resolution column"
        value={orderByColumn}
        onChange={onChange}
      />
    </div>
  );
}

OrderByColumnSelector.propTypes = {
  onChange: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
  orderByColumn: PropTypes.object,
};

function directionLabels(column) {
  switch (column.get('type')) {
    case 'date': return { asc: 'earliest', desc: 'latest' };
    case 'number': return { asc: 'lowest', desc: 'highest' };
    default: return { asc: 'first', desc: 'last' };
  }
}

function DirectionSelector({ onChange, direction, column }) {
  const { asc, desc } = directionLabels(column);
  return (
    <SelectMenu
      options={[
        { label: asc, value: 'ASC' },
        { label: desc, value: 'DESC' },
      ]}
      value={direction}
      onChange={onChange}
    />
  );
}

DirectionSelector.propTypes = {
  onChange: PropTypes.func.isRequired,
  direction: PropTypes.string.isRequired,
  column: PropTypes.object.isRequired,
};


function MergeColumnSelector({ onChange, columns, selected }) {
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

MergeColumnSelector.propTypes = {
  onChange: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
  selected: PropTypes.array,
};

function guessKeyColumn(dataset) {
  const columns = dataset.get('columns').filter(column => column.get('key'));
  if (columns.size === 1) {
    return columns.get(0);
  }
  const identifierColumn = columns.find(column => column.get('columnName') === 'identifier');

  return identifierColumn;
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
    this.setState({
      loadingDataset: true,
    });
    const id = dataset.get('id');
    dispatch(ensureDatasetFullyLoaded(id))
      .then((ds) => {
        const guessedKeyColumn = guessKeyColumn(ds);
        this.setState({
          loadingDataset: false,
          dataset: ds,
          keyColumn: guessedKeyColumn,
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
          <KeyColumnSelector
            columns={dataset.get('columns')}
            keyColumn={keyColumn}
            onChange={column => this.handleSelectKeyColumn(column)}
          />
        }
        {keyColumn != null && !keyColumn.get('key') &&
          <OrderByColumnSelector
            columns={dataset.get('columns')}
            orderByColumn={orderByColumn}
            onChange={column => this.handleSelectOrderByColumn(column)}
          />
        }
        {orderByColumn != null &&
          <DirectionSelector
            direction={direction}
            column={orderByColumn}
            onChange={dir => this.handleSelectDirection(dir)}
          />
        }
        {keyColumn != null &&
          <MergeColumnSelector
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
