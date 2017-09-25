import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TransformationHeader from './TransformationHeader';
import TargetMergeOptions from './merge/TargetMergeOptions';
import SourceMergeOptions from './merge/SourceMergeOptions';

import './MergeTransformation.scss';

// Returns null if transformation is "incomplete",
// otherwise returns the transformation.
function validateTransformation(transformation) {
  const { source, target } = transformation.args;

  if (
    source.datasetId == null ||
    source.keyColumn == null ||
    source.mergeColumns.length === 0 ||
    target.keyColumn == null
  ) {
    return null;
  }

  return transformation;
}

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

  handleTargetChange(target) {
    const { transformation } = this.state;
    const { args } = transformation;
    const newArgs = Object.assign({}, args, { target });
    const newTransformation = Object.assign({}, transformation, { args: newArgs });
    this.setState({ transformation: newTransformation });
  }

  handleSourceChange(source) {
    const { transformation } = this.state;
    const { args } = transformation;
    const newArgs = Object.assign({}, args, { source });
    const newTransformation = Object.assign({}, transformation, { args: newArgs });
    this.setState({ transformation: newTransformation });
  }

  render() {
    const { datasetId, datasets, onApplyTransformation } = this.props;
    const { transformation } = this.state;
    return (
      <div className="MergeTransformation">
        <TransformationHeader
          datasetId={datasetId}
          transformation={validateTransformation(transformation)}
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
