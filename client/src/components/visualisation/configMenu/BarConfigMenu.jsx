import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';
import { filter, get } from 'lodash';
import { compose, mapProps } from 'recompose';

import SeriesMenu from './SeriesMenu';
import ConfigMenuSectionOptionSelect from '../../common/ConfigMenu/ConfigMenuSectionOptionSelect';
import ConfigMenuSectionOptionText from '../../common/ConfigMenu/ConfigMenuSectionOptionText';
import SortInput from './SortInput';
import ToggleInput from '../../common/ToggleInput';
import ButtonRowInput from './ButtonRowInput';
import { filterColumns } from '../../../utilities/utils';
import ConfigMenuSection from '../../common/ConfigMenu/ConfigMenuSection';
import ConfigMenuSectionOption from '../../common/ConfigMenu/ConfigMenuSectionOption';
import { filterColumns, columnSelectOptions, columnSelectSelectedOption } from '../../../utilities/column';

const getColumnTitle = (columnName, columnOptions) =>
  get(columnOptions.find(obj => obj.value === columnName), 'title');

const getAxisAutoLabels = (spec, columnOptions) => {
  let autoAxisLabelY = spec.metricColumnY ? getColumnTitle(spec.metricColumnY, columnOptions) : '';
  let autoAxisLabelX = spec.bucketColumn ? getColumnTitle(spec.bucketColumn, columnOptions) : '';

  if (spec.bucketColumn !== null) {
    autoAxisLabelY += ` - ${spec.metricAggregation}`;

    if (spec.truncateSize !== null) {
      let truncateOrderIndicator;

      if (spec.sort === 'asc') {
        truncateOrderIndicator = 'bottom';
      } else if (spec.sort === 'dsc') {
        truncateOrderIndicator = 'top';
      } else {
        truncateOrderIndicator = 'first';
      }

      autoAxisLabelX += ` - ${truncateOrderIndicator} ${spec.truncateSize}`;
    }
  }
  if (spec.metricColumnsY.length > 0) {
    autoAxisLabelY = spec.metricAggregation;
  }

  return { x: autoAxisLabelX, y: autoAxisLabelY };
};

const handleChangeSpec = (change, oldSpec, onChangeSpec, columnOptions) => {
  const newSpec = Object.assign({}, oldSpec, change);
  const axisLabelUpdateTriggers = [
    'bucketColumn',
    'subBucketColumn',
    'truncateSize',
    'metricAggregation',
    'metricColumnY',
    'metricColumnX',
    'sort',
  ];

  const shouldUpdateAxisLabels = axisLabelUpdateTriggers.some(trigger =>
      Object.keys(change).some(key => key.toString() === trigger.toString())
  ) && (newSpec.metricColumnY !== null);

  if (!shouldUpdateAxisLabels) {
    onChangeSpec(change);
  }

  const oldAutoLabels = getAxisAutoLabels(oldSpec, columnOptions);
  const newAutoLabels = getAxisAutoLabels(newSpec, columnOptions);

  const axisLabelX = oldAutoLabels.x !== newAutoLabels.x ? // eslint-disable-line
    newAutoLabels.x :
    (newSpec.axisLabelXFromUser ? newSpec.axisLabelX : newAutoLabels.x);
  const axisLabelY = oldAutoLabels.y !== newAutoLabels.y ? // eslint-disable-line
    newAutoLabels.y :
    (newSpec.axisLabelYFromUser ? newSpec.axisLabelY : newAutoLabels.y);

  const finalSpec = Object.assign({}, newSpec, { axisLabelY, axisLabelX });

  onChangeSpec(finalSpec);
};
class BarConfigMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      splitColumn: props.visualisation.spec.subBucketColumn !== null,
    };
    this.splitColumnHandler = this.splitColumnHandler.bind(this);
  }

  splitColumnHandler() {
    const {
      visualisation,
      onChangeSpec,
      columnOptions,
    } = this.props;
    const spec = visualisation.spec;
    if (this.state.splitColumn) {
      handleChangeSpec({
        subBucketColumn: null,
        subBucketMethod: 'split',
        legendTitle: columnOptions.find(item => item.value === null) ?
          columnOptions.find(item => item.value === null).title : null,
      }, spec, onChangeSpec, columnOptions);
    }
    this.setState({ splitColumn: !this.state.splitColumn });
  }

  render() {
    const {
      splitColumn,
    } = this.state;
    const {
      visualisation,
      onChangeSpec,
      columnOptions,
      aggregationOptions,
    } = this.props;
    const spec = visualisation.spec;
    const seriesColumnOptions = columnOptions.filter(c => c.value !== spec.metricColumnY);
    const metricColumnsY = spec.metricColumnsY || [];
    const subBucketMethodView = splitColumn && spec.bucketColumn && spec.subBucketColumn ? (
      <ConfigMenuSectionOption
        labelTextId="sub_bucket_method"
      >
        <ButtonRowInput
          options={[
            {
              value: 'split',
              label: <FormattedMessage id="split_bars" />,
            },
            {
              value: 'stack',
              label: <FormattedMessage id="stack_bars" />,
            },
            {
              value: 'stack_percentage',
              label: <FormattedMessage id="percentage_stack_bars" />,
            },
          ]}
          selected={spec.subBucketMethod || 'split'}
          onChange={subBucketMethod => handleChangeSpec({
            subBucketMethod,
          }, spec, onChangeSpec, columnOptions)}
        />
      </ConfigMenuSectionOption>
    ) : '';
    const subBucketView = splitColumn ? (<ConfigMenuSectionOptionSelect
      placeholderId="select_a_sub_bucket_column"
      labelTextId="sub_bucket_column"
      value={spec.subBucketColumn !== null ?
        spec.subBucketColumn.toString() : null}
      name="subGroupColumnMenu"
      options={filterColumns(columnOptions, ['text'])}
      clearable
      disabled={spec.bucketColumn === null}
      onChange={value => handleChangeSpec({
        subBucketColumn: value,
        legendTitle: columnOptions.find(item => item.value === value) ?
          columnOptions.find(item => item.value === value).title : null,
      }, spec, onChangeSpec, columnOptions)}
    />) : '';
    return (
      <div>
        <ConfigMenuSection
          title="x_axis"
          options={(
            <div>
              <div data-test-id="bucket-select">
                <ConfigMenuSectionOptionSelect
                  placeholderId="select_a_data_column_to_group_by"
                  labelTextId="bucket_column"
                  value={spec.bucketColumn !== null ?
                  spec.bucketColumn.toString() : null}
                  name="xGroupColumnMenu"
                  options={filterColumns(columnOptions, ['number', 'text'])}
                  clearable
                  onChange={value => handleChangeSpec({
                    bucketColumn: value,
                  }, spec, onChangeSpec, columnOptions)}
                />
              </div>
              {spec.bucketColumn !== null && (
                <ConfigMenuSectionOptionSelect
                  labelTextId="number_of_buckets_to_show"
                  value={spec.truncateSize !== null ? spec.truncateSize.toString() : null}
                  name="truncateSizeInput"
                  disabled={spec.bucketColumn === null}
                  clearable
                  options={[
                    {
                      value: '10',
                      label: '10',
                    },
                    {
                      value: '25',
                      label: '25',
                    },
                    {
                      value: '50',
                      label: '50',
                    },
                    {
                      value: '100',
                      label: '100',
                    },
                    {
                      value: '200',
                      label: '200',
                    },
                  ]}
                  onChange={value => handleChangeSpec({
                    truncateSize: value,
                  }, spec, onChangeSpec, columnOptions)}
                />
              )}
              <SortInput
                spec={spec}
                onChangeSpec={value => handleChangeSpec(value, spec, onChangeSpec, columnOptions)}
              />
              <ToggleInput
                name="splitBucket"
                type="checkbox"
                labelId="split_bucket"
                disabled={metricColumnsY.length > 0}
                className="InputGroup"
                checked={splitColumn}
                onChange={this.splitColumnHandler}
              />
              {subBucketView}
              {subBucketMethodView}
            </div>
          )}
          advancedOptions={(
            <div>
              {spec.bucketColumn !== null && (
                <div>
                  <ConfigMenuSectionOptionText
                    value={spec.legendTitle != null ? spec.legendTitle.toString() : null}
                    placeholderId="legend_title"
                    name="legendLabel"
                    maxLength={32}
                    onChange={event => handleChangeSpec({
                      legendTitle: event.target.value.toString(),
                    }, spec, onChangeSpec, columnOptions)}
                  />
                  <ConfigMenuSectionOptionSelect
                    placeholderId="legend_position"
                    value={spec.legendPosition}
                    name="legendPosition"
                    options={[
                      {
                        label: this.props.intl.formatMessage({ id: 'legend_position_auto' }),
                        value: null,
                      },
                      {
                        label: this.props.intl.formatMessage({ id: 'legend_position_top' }),
                        value: 'top',
                      },
                      {
                        label: this.props.intl.formatMessage({ id: 'legend_position_right' }),
                        value: 'right',
                      },
                      {
                        label: this.props.intl.formatMessage({ id: 'legend_position_bottom' }),
                        value: 'bottom',
                      },
                      {
                        label: this.props.intl.formatMessage({ id: 'legend_position_left' }),
                        value: 'left',
                      },
                    ]}
                    clearable
                    onChange={value => onChangeSpec({ legendPosition: value })}
                  />
                </div>
              )}
              <ConfigMenuSectionOptionText
                value={spec.axisLabelX !== null ? spec.axisLabelX.toString() : null}
                placeholderId="x_axis_label"
                name="xLabel"
                onChange={event => handleChangeSpec({
                  axisLabelX: event.target.value.toString(),
                  axisLabelXFromUser: true,
                }, spec, onChangeSpec, columnOptions)}
              />
              <ToggleInput
                name="showValueLabels"
                type="checkbox"
                labelId="show_labels"
                className="InputGroup"
                checked={typeof spec.showValueLabels !== 'undefined' ? spec.showValueLabels : false}
                onChange={val => onChangeSpec({
                  showValueLabels: val,
                })}
              />
            </div>
          )}
        />
        <ConfigMenuSection
          title="y_axis"
          options={(
            <div>
              <ConfigMenuSectionOptionSelect
                placeholderId={spec.bucketColumn !== null ?
                  'choose_aggregation_type' : 'must_choose_bucket_column_first'}
                labelTextId="aggregation_type"
                value={spec.bucketColumn !== null ?
                  spec.metricAggregation.toString() : null}
                name="yAggregationMenu"
                options={aggregationOptions}
                disabled={spec.bucketColumn === null}
                onChange={value => handleChangeSpec({
                  metricAggregation: value,
                }, spec, onChangeSpec, columnOptions)}
              />
              <ConfigMenuSectionOptionSelect
                id="metric_column"
                placeholderId="select_a_metric_column"
                labelTextId={metricColumnsY.length === 0 ? 'metric_column' : 'metric_columns'}
                value={spec.metricColumnY !== null ? spec.metricColumnY.toString() : null}
                name="metricColumnYInput"
                options={filterColumns(columnOptions, ['number'])}
                onChange={value => handleChangeSpec({
                  metricColumnY: value,
                }, spec, onChangeSpec, columnOptions)}
              />
              {splitColumn === false ? <SeriesMenu
                hasDataset={Boolean(visualisation.datasetId !== null)}
                onChangeSpec={onChangeSpec}
                metricColumnsY={metricColumnsY}
                metricColumnYTitle={getColumnTitle(spec.metricColumnY, columnOptions)}
                metricAggregation={spec.metricAggregation}
                columnOptions={filterColumns(seriesColumnOptions, ['number'])}
              /> : ''}
            </div>
          )}
          advancedOptions={metricColumnsY.length === 0 ? (
            <ConfigMenuSectionOptionText
              value={spec.axisLabelY !== null ? spec.axisLabelY.toString() : null}
              placeholderId="y_axis_label"
              name="yLabel"
              onChange={event => handleChangeSpec({
                axisLabelY: event.target.value.toString(),
                axisLabelYFromUser: true,
              }, spec, onChangeSpec, columnOptions)}
            />
          ) : ''}
        />
        <ConfigMenuSection
          title="misc"
          options={(
            <ToggleInput
              name="horizontal"
              type="checkbox"
              labelId="horizontal"
              className="InputGroup"
              checked={typeof spec.horizontal !== 'undefined' ? spec.horizontal : false}
              onChange={val => onChangeSpec({
                horizontal: val,
              })}
            />
          )}
        />
      </div>
    );
  }
}

BarConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  aggregationOptions: PropTypes.array.isRequired,
  intl: intlShape,
};

export default compose(
  mapProps((props) => {
    const {
      visualisation,
      columnOptions,
    } = props;
    const spec = visualisation.spec;
    const subBucketColumn = filter(columnOptions, ['value', spec.subBucketColumn])[0];
    const subBucketColumnTypeCondition = subBucketColumn ? subBucketColumn.type !== 'text' : true;
    if (spec.subBucketColumn && subBucketColumnTypeCondition) {
      spec.subBucketColumn = spec.subBucketColumn;
      spec.subBucketMethod = 'split';
    }
    return { ...props, visualisation: { ...visualisation, spec } };
  })
)(injectIntl(BarConfigMenu));
