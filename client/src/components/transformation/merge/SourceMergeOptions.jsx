import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ensureDatasetFullyLoaded } from '../../../actions/dataset';
import SelectDataset from './SelectDataset';
import SelectColumn from './SelectColumn';
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
  selected: PropTypes.object,
};

class SourceMergeOptions extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loadingDataset: false,
      dataset: null,
      keyColumn: null,
      mergeColumns: [],
    };
  }

  handleSelectDataset(dataset) {
    const { dispatch, onChange } = this.props;
    this.setState({
      loadingDataset: true,
    });
    const id = dataset.get('id');
    dispatch(ensureDatasetFullyLoaded(id))
      .then((ds) => {
        this.setState({
          loadingDataset: false,
          dataset: ds,
          keyColumn: null,
          mergeColumns: [],
        });
        onChange({
          datasetId: ds.get('id'),
          keyColumn: null,
          mergeColumns: [],
        });
      });
  }

  handleSelectKeyColumn(column) {
    const { onChange } = this.props;
    const { dataset, mergeColumns } = this.state;
    this.setState({ keyColumn: column });
    onChange({
      datasetId: dataset.get('id'),
      keyColumn: column.get('columnName'),
      mergeColumns: mergeColumns.map(col => col.get('columnName')),
    });
  }

  handleToggleMergeColumn(column) {
    const { onChange } = this.props;
    const { mergeColumns, keyColumn, dataset } = this.state;

    const newMergeColumns = mergeColumns.includes(column) ?
      mergeColumns.filter(col => col !== column) :
      [column, ...mergeColumns];

    this.setState({
      mergeColumns: newMergeColumns,
    });

    onChange({
      datasetId: dataset.get('id'),
      keyColumn: keyColumn.get('columnName'),
      mergeColumns: newMergeColumns.map(col => col.get('columnName')),
    });
  }

  render() {
    const { datasets } = this.props;
    const { dataset, loadingDataset, keyColumn, mergeColumns } = this.state;

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
