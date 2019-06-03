// TODO i18n
import { findIndex, countBy } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { injectIntl, intlShape } from 'react-intl';

import DeriveCategoryMappingsText from './derive-category/DeriveCategoryMappingsText';
import SourceDeriveCategoryOptions from './derive-category/SourceDeriveCategoryOptions';
import './DeriveCategoryTransformation.scss';
import TransformationHeader from './TransformationHeader';
import { showNotification } from '../../actions/notification';

class DeriveCategoryTransformation extends Component {

  constructor(props) {
    super(props);
    this.state = {
      duplicatedCategoryNames: [],
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
    this.handleValidate = this.handleValidate.bind(this);
    this.handleApplyTransformation = this.handleApplyTransformation.bind(this);
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
    this.setState({ transformation: newTransformation }, this.handleValidate);
  }

  handleValidate() {
    const { mappings, uncategorizedValue } = this.state.transformation.args.derivation;
    // eslint-disable-next-line no-unused-vars
    const categoryCounts = countBy(mappings, ([sv, categoryName]) => categoryName);
    categoryCounts[uncategorizedValue] = categoryCounts[uncategorizedValue] || 0;
    categoryCounts[uncategorizedValue] += 1;
    const duplicatedCategoryNames = Object.keys(categoryCounts).reduce((acc, categoryName) =>
      (categoryCounts[categoryName] > 1 ? acc.concat(categoryName) : acc)
    , []);
    this.setState({ duplicatedCategoryNames });
  }

  handleApplyTransformation() {
    const { onApplyTransformation, intl, onAlert } = this.props;
    const { transformation, duplicatedCategoryNames, columnType } = this.state;

    if (duplicatedCategoryNames.length) {
      onAlert(showNotification('error', intl.formatMessage({ id: 'categories_must_be_unique' })));
      return;
    }

    onApplyTransformation({
      ...transformation,
      args: {
        ...transformation.args,
        derivation: {
          ...transformation.args.derivation,
          type: columnType,
          mappings: transformation.args.derivation.mappings.map(([sourceValues, target]) =>
            [
              // eslint-disable-next-line no-unused-vars
              sourceValues.map(([count, value]) => value),
              target,
            ]
          ),
        },
      },
    });
  }
  findColumn(columns, columnName) {
    return columns
    .filter(column => column.columnName === columnName)[0];
  }
  render() {
    const {
      datasetId,
      datasets,
      transforming,
      onFetchSortedDataset,
      intl,
    } = this.props;
    const {
      transformation,
      selectingSourceColumn,
      duplicatedCategoryNames,
      columnType } = this.state;
    const dataset = datasets[datasetId].toJS();
    console.log(transformation.args.source.column);
    return (
      <div className="DeriveCategoryTransformation">

        <TransformationHeader
          datasetId={datasetId}
          isValidTransformation={this.isValidTransformation() && !transforming}
          onApply={this.handleApplyTransformation}
          buttonText={intl.formatMessage({ id: 'derive_column' })}
          titleText={intl.formatMessage({ id: 'new_category_column' })}
        />

        <div className="DeriveCategoryTransformation__container">

          {(!transformation.args.source.column.columnName || selectingSourceColumn) && (
            <SourceDeriveCategoryOptions
              dataset={dataset}
              selected={transformation.args.source.column.columnName}
              onChange={(columnName) => {
                console.log('selected column', this.findColumn(dataset.columns, columnName));
                if (columnName !== transformation.args.source.column.columnName) {
                  onFetchSortedDataset(datasetId, columnName);
                  this.setState({
                    columnType: this.findColumn(dataset.columns, columnName).type,
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

          {transformation.args.source.column.columnName && !selectingSourceColumn && columnType === 'text'
          && (
            <DeriveCategoryMappingsText
              mappings={transformation.args.derivation.mappings || []}
              uncategorizedValue={transformation.args.derivation.uncategorizedValue}
              sourceColumnIndex={findIndex(
                dataset.columns,
                ({ columnName }) => columnName === transformation.args.source.column.columnName
              )}
              dataset={dataset}
              onReselectSourceColumn={() => {
                this.setState({ selectingSourceColumn: true }, this.handleValidate);
              }}
              duplicatedCategoryNames={duplicatedCategoryNames}
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
                }, this.handleValidate);
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
                }, this.handleValidate);
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
                }, this.handleValidate);
              }}
            />
          )}
          {transformation.args.source.column.columnName && !selectingSourceColumn && columnType === 'number'
          && (
            <div>You selected number type</div>
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
  onAlert: PropTypes.func.isRequired,
};

export default injectIntl(DeriveCategoryTransformation);
