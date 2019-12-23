import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { intlShape } from 'react-intl';
import TransformationHeader from './TransformationHeader';
import TargetMergeOptions from './merge/TargetMergeOptions';
import SourceMergeOptions from './merge/SourceMergeOptions';

import './MergeTransformation.scss';

export default class MergeTransformation extends Component {

  constructor(props) {
    super(props);
    this.state = {
      transformation: {
        op: 'core/merge-datasets',
        args: {
          source: {
            datasetId: null,
            mergeColumn: null,
            aggregationColumn: null,
            aggregationDirection: 'DESC',
            mergeColumns: Immutable.fromJS([]), // Array of column names.
          },
          target: {
            mergeColumn: null,
          },
        },
      },
    };
  }

  isValidTransformation() {
    const { transformation: { args: { source, target } } } = this.state;
    return (
      source.datasetId != null &&
      source.mergeColumn != null &&
      source.mergeColumns.size > 0 &&
      target.mergeColumn != null
    );
  }

  handleArgsChange(changedArgs) {
    const { transformation } = this.state;
    const { args } = transformation;
    const newArgs = Object.assign({}, args, changedArgs);
    const newTransformation = Object.assign({}, transformation, { args: newArgs });
    this.setState({ transformation: newTransformation });
  }

  handleTargetChange(target) {
    this.handleArgsChange({ target });
  }

  handleSourceChange(source) {
    this.handleArgsChange({ source });
  }

  render() {
    const { datasetId, datasets, onApplyTransformation, transforming, intl } = this.props;
    const { transformation } = this.state;
    return (
      <div className="MergeTransformation">
        <TransformationHeader
          datasetId={datasetId}
          isValidTransformation={this.isValidTransformation() && !transforming}
          onApply={() => onApplyTransformation(transformation)}
          buttonText="Merge"
          titleText="Merge Datasets"
        />
        <div className="container">
          <TargetMergeOptions
            dataset={datasets[datasetId]}
            onChange={target => this.handleTargetChange(target)}
            intl={intl}
          />
          <div className="separator" />
          <SourceMergeOptions
            datasets={datasets}
            onChange={source => this.handleSourceChange(source)}
            intl={intl}
          />
        </div>
      </div>
    );
  }
}

MergeTransformation.propTypes = {
  datasets: PropTypes.object.isRequired,
  datasetId: PropTypes.string.isRequired,
  onApplyTransformation: PropTypes.func.isRequired,
  // Are we currently applying a transformation.
  transforming: PropTypes.bool.isRequired,
  intl: intlShape,
};
