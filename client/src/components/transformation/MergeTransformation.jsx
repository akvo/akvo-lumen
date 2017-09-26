import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TransformationHeader from './TransformationHeader';
import TargetMergeOptions from './merge/TargetMergeOptions';
import SourceMergeOptions from './merge/SourceMergeOptions';

import './MergeTransformation.scss';

export default class MergeTransformation extends Component {

  constructor(props) {
    super(props);
    this.state = {
      transformation: {
        op: 'core/merge-dataset',
        args: {
          source: {
            datasetId: null,
            keyColumn: null,
            mergeColumns: [], // Array of column names.
          },
          target: {
            keyColumn: null,
          },
        },
      },
    };
  }

  isValidTransformation() {
    const { transformation: { args: { source, target } } } = this.state;
    return (
      source.datasetId != null &&
      source.keyColumn != null &&
      source.mergeColumns.length > 0 &&
      target.keyColumn != null
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
    const { datasetId, datasets, onApplyTransformation } = this.props;
    const { transformation } = this.state;
    return (
      <div className="MergeTransformation">
        <TransformationHeader
          datasetId={datasetId}
          isValidTransformation={this.isValidTransformation()}
          onApply={() => onApplyTransformation(transformation)}
          buttonText="Merge"
          titleText="Merge Datasets"
        />
        <div className="container">
          <TargetMergeOptions
            dataset={datasets[datasetId]}
            onChange={target => this.handleTargetChange(target)}
          />
          <div className="separator" />
          <SourceMergeOptions
            datasets={datasets}
            onChange={source => this.handleSourceChange(source)}
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
};
