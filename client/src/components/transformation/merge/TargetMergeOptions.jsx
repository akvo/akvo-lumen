import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { intlShape } from 'react-intl';
import { ensureDatasetFullyLoaded } from '../../../actions/dataset';
import SelectMenu from '../../common/SelectMenu';
import { guessMergeColumn, getColumnName } from './utils';
import './TargetMergeOptions.scss';
import { columnSelectOptions, columnSelectSelectedOption } from '../../../utilities/column';

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
        this.setState({ loading: false, mergeColumn: guessedMergeColumn });
        onChange({ mergeColumn: getColumnName(guessedMergeColumn) });
      });
  }

  handleSelectMergeColumn(column) {
    const { onChange } = this.props;
    this.setState({ mergeColumn: column });
    onChange({
      mergeColumn: column,
    });
  }

  render() {
    const { loading, mergeColumn } = this.state;
    if (loading) return null;
    const { dataset, intl } = this.props;
    return (
      <div className="TargetMergeOptions">
        <h1>Dataset 1</h1>
        <p>{dataset.get('name')} ({dataset.get('columns').size} columns)</p>
        <h1>Merge column</h1>
        <SelectMenu
          placeholder="Select merge column"
          options={columnSelectOptions(intl, dataset.get('columns'))}
          value={columnSelectSelectedOption(mergeColumn, dataset.get('columns'))}
          onChange={column => this.handleSelectMergeColumn(column)}
          intl={intl}
        />
      </div>
    );
  }
}

TargetMergeOptions.propTypes = {
  dispatch: PropTypes.func.isRequired,
  dataset: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  intl: intlShape,
};

// Inject dispatch only
export default connect()(TargetMergeOptions);
