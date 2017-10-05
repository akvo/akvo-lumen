import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ensureDatasetFullyLoaded } from '../../../actions/dataset';
import SelectColumn from './SelectColumn';
import { guessMergeColumn, getColumnName } from './utils';
import './TargetMergeOptions.scss';

class TargetMergeOptions extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      mergeColumn: null,
    };
  }

  componentWillMount() {
    const { dispatch, dataset, onChange } = this.props;
    dispatch(ensureDatasetFullyLoaded(dataset.get('id')))
      .then((ds) => {
        // Preselect sensible defaults for Flow datasets
        const guessedMergeColumn = guessMergeColumn(ds);
        this.setState({ loading: false, keyColumn: guessedMergeColumn });
        onChange({ mergeColumn: getColumnName(guessedMergeColumn) });
      });
  }

  handleSelectKeyColumn(column) {
    const { onChange } = this.props;
    this.setState({ keyColumn: column });
    onChange({
      keyColumn: column.get('columnName'),
    });
  }

  render() {
    const { loading, mergeColumn } = this.state;
    if (loading) return null;
    const { dataset } = this.props;
    return (
      <div className="TargetMergeOptions">
        <h1>Dataset 1</h1>
        <p>{dataset.get('name')} ({dataset.get('columns').size} columns)</p>
        <h1>Merge column</h1>
        <SelectColumn
          placeholder="Select merge column"
          columns={dataset.get('columns')}
          value={mergeColumn}
          onChange={column => this.handleSelectKeyColumn(column)}
        />
      </div>
    );
  }
}

TargetMergeOptions.propTypes = {
  dispatch: PropTypes.func.isRequired,
  dataset: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

// Inject dispatch only
export default connect()(TargetMergeOptions);
