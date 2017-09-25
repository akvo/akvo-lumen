import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ensureDatasetFullyLoaded } from '../../../actions/dataset';
import SelectColumn from './SelectColumn';
import './TargetMergeOptions.scss';

class TargetMergeOptions extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      keyColumn: null,
    };
  }

  componentWillMount() {
    const { dispatch, dataset } = this.props;
    dispatch(ensureDatasetFullyLoaded(dataset.get('id')))
      .then(() => this.setState({ loading: false }));
  }

  handleSelectKeyColumn(column) {
    const { onChange } = this.props;
    this.setState({ keyColumn: column });
    onChange({
      keyColumn: column.get('columnName'),
    });
  }

  render() {
    const { loading, keyColumn } = this.state;
    if (loading) return null;
    const { dataset } = this.props;
    return (
      <div className="TargetMergeOptions">
        <h1>Dataset 1</h1>
        <p>{dataset.get('name')} ({dataset.get('columns').size} columns)</p>
        <h1>Key column</h1>
        <SelectColumn
          placeholder="Select merge column"
          columns={dataset.get('columns')}
          value={keyColumn}
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
