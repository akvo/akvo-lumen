// TODO i18n
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findIndex } from 'lodash';

import TransformationHeader from './TransformationHeader';
import SourceDeriveCategoryOptions from './derive-category/SourceDeriveCategoryOptions';
import DeriveCategoryMappings from './derive-category/DeriveCategoryMappings';
import './DeriveCategoryTransformation.scss';

export default class DeriveCategoryTransformation extends Component {

  constructor(props) {
    super(props);
    this.state = {
      selectingSourceColumn: false,
      transformation: {
        op: '',
        args: {},
      },
    };
  }

  componentDidMount() {
    const { datasetId, datasets, onFetchDataset } = this.props;
    const dataset = datasets[datasetId];

    if (dataset == null || dataset.get('rows') == null) {
      onFetchDataset(datasetId);
    }
  }

  isValidTransformation() {
    // const { transformation: { args: {} } } = this.state;
    return false;
  }

  handleArgsChange(changedArgs) {
    const { transformation } = this.state;
    const { args } = transformation;
    const newArgs = Object.assign({}, args, changedArgs);
    const newTransformation = Object.assign({}, transformation, { args: newArgs });
    this.setState({ transformation: newTransformation });
  }

  render() {
    const { datasetId, datasets, onApplyTransformation, transforming } = this.props;
    const { transformation, selectingSourceColumn } = this.state;
    const dataset = datasets[datasetId].toJS();
    return (
      <div className="DeriveCategoryTransformation">

        <TransformationHeader
          datasetId={datasetId}
          isValidTransformation={this.isValidTransformation() && !transforming}
          onApply={() => onApplyTransformation(transformation)}
          buttonText="Derive Column"
          titleText="New Category Column"
        />

        <div className="DeriveCategoryTransformation__container">

          {(!transformation.args.sourceColumn || selectingSourceColumn) && (
            <SourceDeriveCategoryOptions
              dataset={dataset}
              selected={transformation.args.sourceColumn}
              onChange={(sourceColumn) => {
                if (sourceColumn !== transformation.args.sourceColumn) {
                  this.setState({
                    selectingSourceColumn: false,
                    transformation: {
                      ...this.state.transformation,
                      args: {
                        ...this.state.transformation.args,
                        sourceColumn,
                        mappings: [],
                      },
                    },
                  });
                } else {
                  this.setState({
                    selectingSourceColumn: false,
                  });
                }
              }}
            />
          )}

          {transformation.args.sourceColumn && !selectingSourceColumn && (
            <DeriveCategoryMappings
              mappings={transformation.args.mappings || []}
              sourceColumnIndex={findIndex(
                dataset.columns,
                ({ columnName }) => columnName === transformation.args.sourceColumn
              )}
              dataset={dataset}
              onReselectSourceColumn={() => {
                this.setState({ selectingSourceColumn: true });
              }}
              onChange={(mappings) => {
                this.setState({
                  transformation: {
                    ...this.state.transformation,
                    args: {
                      ...this.state.transformation.args,
                      mappings,
                    },
                  },
                });
              }}
            />
          )}

        </div>
      </div>
    );
  }
}

DeriveCategoryTransformation.propTypes = {
  datasets: PropTypes.object.isRequired,
  datasetId: PropTypes.string.isRequired,
  onApplyTransformation: PropTypes.func.isRequired,
  onFetchDataset: PropTypes.func.isRequired,
  // Are we currently applying a transformation.
  transforming: PropTypes.bool.isRequired,
};
