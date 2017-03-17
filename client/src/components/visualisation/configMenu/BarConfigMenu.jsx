import React, { PropTypes } from 'react';
import SelectInput from './SelectInput';
import LabelInput from './LabelInput';
import Subtitle from './Subtitle';
import SortInput from './SortInput';

const getColumnTitle = (columnName, columnOptions) =>
  columnOptions.find(obj => obj.value === columnName).title;

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

  let autoAxisLabelY = getColumnTitle(newSpec.metricColumnY, columnOptions);
  let autoAxisLabelX = newSpec.bucketColumn ? getColumnTitle(newSpec.bucketColumn, columnOptions) : '';

  if (newSpec.bucketColumn !== null) {
    autoAxisLabelY += ` - ${newSpec.metricAggregation}`;

    if (newSpec.truncateSize !== null) {
      let truncateOrderIndicator;

      if (newSpec.sort === 'asc') {
        truncateOrderIndicator = 'bottom';
      } else if (newSpec.sort === 'dsc') {
        truncateOrderIndicator = 'top';
      } else {
        truncateOrderIndicator = 'first';
      }

      autoAxisLabelX += ` - ${truncateOrderIndicator} ${newSpec.truncateSize}`;
    }
  }

  const axisLabelX = newSpec.axisLabelXFromUser ? newSpec.axisLabelX : autoAxisLabelX;
  const axisLabelY = newSpec.axisLabelYFromUser ? newSpec.axisLabelY : autoAxisLabelY;

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
      <Subtitle>Y-Axis</Subtitle>
      <SelectInput
        placeholder="Select a metric column"
        labelText="Metric column"
        choice={spec.metricColumnY !== null ? spec.metricColumnY.toString() : null}
        name="metricColumnYInput"
        options={columnOptions}
        onChange={value => handleChangeSpec({
          metricColumnY: value,
        }, spec, onChangeSpec, columnOptions)}
      />
      <SelectInput
        placeholder={spec.bucketColumn !== null ?
          'Choose aggregation type...' : 'Must choose bucket column first'}
        labelText="Aggregation type"
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
        placeholder="Y Axis label"
        name="yLabel"
        onChange={event => handleChangeSpec({
          axisLabelY: event.target.value.toString(),
          axisLabelYFromUser: true,
        }, spec, onChangeSpec, columnOptions)}
      />
      <Subtitle>X-Axis</Subtitle>
      <SelectInput
        placeholder="Select a data column to group by"
        labelText="Bucket column"
        choice={spec.bucketColumn !== null ?
          spec.bucketColumn.toString() : null}
        name="xGroupColumnMenu"
        options={columnOptions}
        clearable
        onChange={value => handleChangeSpec({
          bucketColumn: value,
        }, spec, onChangeSpec, columnOptions)}
      />
      {spec.bucketColumn !== null &&
        <div>
          <SelectInput
            labelText="Number of buckets to show"
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
            columnOptions={columnOptions}
            onChangeSpec={value => handleChangeSpec(value, spec, onChangeSpec, columnOptions)}
          />
          <SelectInput
            placeholder="Select a sub-bucket column"
            labelText="Sub-bucket column"
            choice={spec.subBucketColumn !== null ?
              spec.subBucketColumn.toString() : null}
            name="subGroupColumnMenu"
            options={columnOptions}
            clearable
            disabled={spec.bucketColumn === null}
            onChange={value => handleChangeSpec({
              subBucketColumn: value,
              legendTitle: columnOptions.find(item => item.value === value) ?
                columnOptions.find(item => item.value === value).title : null,
            }, spec, onChangeSpec, columnOptions)}
          />
          <SelectInput
            labelText="Sub-bucket method"
            choice={spec.subBucketMethod !== null ? spec.subBucketMethod.toString() : null}
            name="subBucketMethodInput"
            disabled={spec.bucketColumn === null || spec.subBucketColumn === null}
            options={[
              {
                value: 'split',
                label: 'Split bars',
              },
              {
                value: 'stack',
                label: 'Stack bars',
              },
            ]}
            onChange={value => handleChangeSpec({
              subBucketMethod: value,
            }, spec, onChangeSpec, columnOptions)}
          />
          <LabelInput
            value={spec.legendTitle != null ? spec.legendTitle.toString() : null}
            placeholder="Legend title"
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
        placeholder="X Axis label"
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
