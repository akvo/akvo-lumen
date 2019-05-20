// TODO i18n
import { findIndex } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { injectIntl, intlShape } from 'react-intl';

import DeriveCategoryMappings from './derive-category/DeriveCategoryMappings';
import SourceDeriveCategoryOptions from './derive-category/SourceDeriveCategoryOptions';
import './DeriveCategoryTransformation.scss';
import TransformationHeader from './TransformationHeader';

class DeriveCategoryTransformation extends Component {

  constructor(props) {
    super(props);
    this.state = {
      selectingSourceColumn: false,
      transformation: {
        op: 'core/derive-category',
        args: {
          source: {
            column: {},
          },
          target: {
            column: {},
          },
          derivation: {
            mappings: [],
            uncategorizedValue: props.intl.formatMessage({ id: 'uncategorized' }),
          },
        },
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
    const { source, target, derivation } = this.state.transformation.args;
    if (source.column.columnName && target.column.title && derivation.mappings.length) {
      return true;
    }
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
    const {
      datasetId,
      datasets,
      onApplyTransformation,
      transforming,
      onFetchSortedDataset,
      intl,
    } = this.props;
    const { transformation, selectingSourceColumn } = this.state;
    const dataset = datasets[datasetId].toJS();

    return (
      <div className="DeriveCategoryTransformation">

        <TransformationHeader
          datasetId={datasetId}
          isValidTransformation={this.isValidTransformation() && !transforming}
          onApply={() => onApplyTransformation({
            ...transformation,
            args: {
              ...transformation.args,
              derivation: {
                ...transformation.args.derivation,
                mappings: transformation.args.derivation.mappings.map(([sourceValues, target]) =>
                  [
                    // eslint-disable-next-line no-unused-vars
                    sourceValues.map(([count, value]) => value),
                    target,
                  ]
                ),
              },
            },
          })}
          buttonText={intl.formatMessage({ id: 'derive_column' })}
          titleText={intl.formatMessage({ id: 'new_category_column' })}
        />

        <div className="DeriveCategoryTransformation__container">

          {(!transformation.args.source.column.columnName || selectingSourceColumn) && (
            <SourceDeriveCategoryOptions
              dataset={dataset}
              selected={transformation.args.source.column.columnName}
              onChange={(columnName) => {
                if (columnName !== transformation.args.source.column.columnName) {
                  onFetchSortedDataset(datasetId, columnName);
                  this.setState({
                    selectingSourceColumn: false,
                    transformation: {
                      ...this.state.transformation,
                      args: {
                        ...this.state.transformation.args,
                        source: {
                          ...this.state.transformation.args.source,
                          column: {
                            ...this.state.transformation.args.source.column,
                            columnName,
                          },
                        },
                        derivation: {
                          ...this.state.transformation.args.derivation,
                          mappings: [],
                        },
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

          {transformation.args.source.column.columnName && !selectingSourceColumn && (
            <DeriveCategoryMappings
              mappings={transformation.args.derivation.mappings || []}
              uncategorizedValue={transformation.args.derivation.uncategorizedValue}
              sourceColumnIndex={findIndex(
                dataset.columns,
                ({ columnName }) => columnName === transformation.args.source.column.columnName
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
                      derivation: {
                        ...this.state.transformation.args.derivation,
                        mappings,
                      },
                    },
                  },
                });
              }}
              onChangeTargetColumnName={(title) => {
                this.setState({
                  transformation: {
                    ...this.state.transformation,
                    args: {
                      ...this.state.transformation.args,
                      target: {
                        ...this.state.transformation.args.target,
                        column: {
                          ...this.state.transformation.args.target.column,
                          title,
                        },
                      },
                    },
                  },
                });
              }}
              onChangeUncategorizedValue={(uncategorizedValue) => {
                this.setState({
                  transformation: {
                    ...this.state.transformation,
                    args: {
                      ...this.state.transformation.args,
                      derivation: {
                        ...this.state.transformation.args.derivation,
                        uncategorizedValue,
                      },
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
  intl: intlShape,
  datasets: PropTypes.object.isRequired,
  datasetId: PropTypes.string.isRequired,
  onApplyTransformation: PropTypes.func.isRequired,
  onFetchDataset: PropTypes.func.isRequired,
  onFetchSortedDataset: PropTypes.func.isRequired,
  // Are we currently applying a transformation.
  transforming: PropTypes.bool.isRequired,
};

export default injectIntl(DeriveCategoryTransformation);
