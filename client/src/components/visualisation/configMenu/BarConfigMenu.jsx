import React, { PropTypes } from 'react';
import SelectInput from './SelectInput';
import LabelInput from './LabelInput';
import Subtitle from './Subtitle';
import SortInput from './SortInput';

export default function BarConfigMenu(props) {
  const {
    visualisation,
    onChangeSpec,
    columnOptions,
    aggregationOptions,
    getColumnMetadata,
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
        onChange={value => onChangeSpec({
          metricColumnY: value,
          metricColumnYName: getColumnMetadata('title', value, columnOptions),
          metricColumnYType: getColumnMetadata('type', value, columnOptions),
        })}
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
        onChange={value => onChangeSpec({
          metricAggregation: value,
        })}
      />
      <LabelInput
        value={spec.axisLabelY !== null ? spec.axisLabelY.toString() : null}
        placeholder="Y Axis label"
        name="yLabel"
        onChange={event => onChangeSpec({
          axisLabelY: event.target.value.toString(),
        })}
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
        onChange={value => onChangeSpec({
          bucketColumn: value,
          bucketColumnName: getColumnMetadata('title', value, columnOptions),
          bucketColumnType: getColumnMetadata('type', value, columnOptions),
        })}
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
            onChange={value => onChangeSpec({
              truncateSize: value,
            })}
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
            onChange={value => onChangeSpec({
              subBucketColumn: value,
              subBucketName: getColumnMetadata('title', value, columnOptions),
              subBucketColumnType: getColumnMetadata('type', value, columnOptions),
            })}
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
            onChange={value => onChangeSpec({
              subBucketMethod: value,
            })}
          />
          <SortInput
            spec={spec}
            columnOptions={columnOptions}
            onChangeSpec={onChangeSpec}
          />
        </div>
      }
      <LabelInput
        value={spec.axisLabelX !== null ? spec.axisLabelX.toString() : null}
        placeholder="X Axis label"
        name="xLabel"
        onChange={event => onChangeSpec({
          axisLabelX: event.target.value.toString(),
        })}
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
  getColumnMetadata: PropTypes.func.isRequired,
};
