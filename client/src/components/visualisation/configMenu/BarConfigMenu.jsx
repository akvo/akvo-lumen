import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import SelectInput from './SelectInput';
import LabelInput from './LabelInput';
import Subtitle from './Subtitle';
import SortInput from './SortInput';
import { filterColumns } from '../../../utilities/utils';

const getColumnTitle = (columnName, columnOptions) =>
  columnOptions.find(obj => obj.value === columnName).title;

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

export default function BarConfigMenu(props) {
  const {
    visualisation,
    onChangeSpec,
    columnOptions,
    aggregationOptions,
  } = props;
  const spec = visualisation.spec;

  return (
    <div>
      <Subtitle><FormattedMessage id="y_axis" /></Subtitle>
      <SelectInput
        placeholderId="select_a_metric_column"
        labelTextId="metric_column"
        choice={spec.metricColumnY !== null ? spec.metricColumnY.toString() : null}
        name="metricColumnYInput"
        options={filterColumns(columnOptions, ['number'])}
        onChange={value => handleChangeSpec({
          metricColumnY: value,
        }, spec, onChangeSpec, columnOptions)}
      />
      <SelectInput
        placeholderId={spec.bucketColumn !== null ?
          'choose_aggregation_type' : 'must_choose_bucket_column_first'}
        labelTextId="aggregation_type"
        choice={spec.bucketColumn !== null ?
          spec.metricAggregation.toString() : null}
        name="yAggregationMenu"
        options={aggregationOptions}
        disabled={spec.bucketColumn === null}
        onChange={value => handleChangeSpec({
          metricAggregation: value,
        }, spec, onChangeSpec, columnOptions)}
      />
      <LabelInput
        value={spec.axisLabelY !== null ? spec.axisLabelY.toString() : null}
        placeholderId="y_axis_label"
        name="yLabel"
        onChange={event => handleChangeSpec({
          axisLabelY: event.target.value.toString(),
          axisLabelYFromUser: true,
        }, spec, onChangeSpec, columnOptions)}
      />
      <Subtitle><FormattedMessage id="x_axis" /></Subtitle>
      <SelectInput
        placeholderId="select_a_data_column_to_group_by"
        labelTextId="bucket_column"
        choice={spec.bucketColumn !== null ?
          spec.bucketColumn.toString() : null}
        name="xGroupColumnMenu"
        options={filterColumns(columnOptions, ['number', 'text'])}
        clearable
        onChange={value => handleChangeSpec({
          bucketColumn: value,
        }, spec, onChangeSpec, columnOptions)}
      />
      {spec.bucketColumn !== null &&
        <div>
          <SelectInput
            labelTextId="number_of_buckets_to_show"
            choice={spec.truncateSize !== null ? spec.truncateSize.toString() : null}
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
          <SortInput
            spec={spec}
            columnOptions={filterColumns(columnOptions, ['number', 'date', 'text'])}
            onChangeSpec={value => handleChangeSpec(value, spec, onChangeSpec, columnOptions)}
          />
          <SelectInput
            placeholderId="select_a_sub_bucket_column"
            labelTextId="sub_bucket_column"
            choice={spec.subBucketColumn !== null ?
              spec.subBucketColumn.toString() : null}
            name="subGroupColumnMenu"
            options={filterColumns(columnOptions, ['number', 'text'])}
            clearable
            disabled={spec.bucketColumn === null}
            onChange={value => handleChangeSpec({
              subBucketColumn: value,
              legendTitle: columnOptions.find(item => item.value === value) ?
                columnOptions.find(item => item.value === value).title : null,
            }, spec, onChangeSpec, columnOptions)}
          />
          <SelectInput
            labelTextId="sub_bucket_method"
            choice={spec.subBucketMethod !== null ? spec.subBucketMethod.toString() : null}
            name="subBucketMethodInput"
            disabled={spec.bucketColumn === null || spec.subBucketColumn === null}
            options={[
              {
                value: 'split',
                labelId: 'split_bars',
              },
              {
                value: 'stack',
                labelId: 'stack_bars',
              },
            ]}
            onChange={value => handleChangeSpec({
              subBucketMethod: value,
            }, spec, onChangeSpec, columnOptions)}
          />
          <LabelInput
            value={spec.legendTitle != null ? spec.legendTitle.toString() : null}
            placeholderId="legend_title"
            name="legendLabel"
            maxLength={32}
            onChange={event => handleChangeSpec({
              legendTitle: event.target.value.toString(),
            }, spec, onChangeSpec, columnOptions)}
          />
        </div>
      }
      <LabelInput
        value={spec.axisLabelX !== null ? spec.axisLabelX.toString() : null}
        placeholderId="x_axis_label"
        name="xLabel"
        onChange={event => handleChangeSpec({
          axisLabelX: event.target.value.toString(),
          axisLabelXFromUser: true,
        }, spec, onChangeSpec, columnOptions)}
      />
    </div>
  );
}

BarConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  aggregationOptions: PropTypes.array.isRequired,
};
