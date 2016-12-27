import React, { PropTypes } from 'react';
import SelectInput from './SelectInput';
import LabelInput from './LabelInput';
import Subtitle from './Subtitle';

export default function ScatterConfigMenu(props) {
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
        name="yColumnInput"
        options={columnOptions}
        onChange={value => onChangeSpec({
          metricColumnY: value,
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
        placeholder="Select a metric column"
        labelText="Metric column"
        choice={spec.metricColumnX !== null ? spec.metricColumnX.toString() : null}
        name="xColumnInput"
        options={columnOptions}
        onChange={value => onChangeSpec({
          metricColumnX: value,
          metricColumnXType: getColumnMetadata('type', value, columnOptions),
        })}
      />
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

ScatterConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  aggregationOptions: PropTypes.array.isRequired,
  getColumnMetadata: PropTypes.func.isRequired,
};
