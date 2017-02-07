import React, { PropTypes } from 'react';
import SelectInput from './SelectInput';
import LabelInput from './LabelInput';
import Subtitle from './Subtitle';

const getColumnTitle = (columnName, columnOptions) =>
  columnOptions.find(obj => obj.value === columnName).title;

const getAxisLabel = (axis, spec, columnOptions) => {
  if (spec[`axisLabel${axis}FromUser`]) {
    return spec[`axisLabel${axis}`];
  }

  let newAxisLabel = '';
  if (axis === 'x') {
    newAxisLabel = getColumnTitle(spec.metricColumnX, columnOptions);

    if (spec.bucketColumn != null) {
      newAxisLabel += ` - ${spec.metricAggregation}`;
    }
  } else {
    newAxisLabel = getColumnTitle(spec.metricColumnY, columnOptions);

    if (spec.bucketColumn != null) {
      newAxisLabel += ` - ${spec.metricAggregation}`;
    }
  }

  return newAxisLabel;
};

const getPopupLabelChoice = (spec) => {
  if (spec.bucketColumn !== null) {
    return spec.bucketColumn;
  }
  if (spec.datapointLabelColumn !== null) {
    return spec.datapointLabelColumn.toString();
  }
  return null;
};

export default function ScatterConfigMenu(props) {
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
        name="yColumnInput"
        options={columnOptions.filter(column => column.type === 'number' || column.type === 'date')}
        onChange={(value) => {
          const change = { metricColumnY: value };

          if (spec.metricColumnX !== null) {
            change.axisLabelX = getAxisLabel('x', Object.assign({}, spec, change), columnOptions);
            change.axisLabelY = getAxisLabel('y', Object.assign({}, spec, change), columnOptions);
          }
          onChangeSpec(change);
        }}
      />
      <LabelInput
        value={spec.axisLabelY !== null ? spec.axisLabelY.toString() : null}
        placeholder="Y Axis label"
        name="yLabel"
        onChange={event => onChangeSpec({
          axisLabelY: event.target.value.toString(),
          axisLabelYFromUser: true,
        })}
      />
      <Subtitle>X-Axis</Subtitle>
      <SelectInput
        placeholder="Select a metric column"
        labelText="Metric column"
        choice={spec.metricColumnX !== null ? spec.metricColumnX.toString() : null}
        name="xColumnInput"
        options={columnOptions.filter(column => column.type === 'number' || column.type === 'date')}
        onChange={(value) => {
          const change = { metricColumnX: value };

          if (spec.metricColumnY !== null) {
            change.axisLabelX = getAxisLabel('x', Object.assign({}, spec, change), columnOptions);
            change.axisLabelY = getAxisLabel('y', Object.assign({}, spec, change), columnOptions);
          }
          onChangeSpec(change);
        }}
      />
      <LabelInput
        value={spec.axisLabelX !== null ? spec.axisLabelX.toString() : null}
        placeholder="X Axis label"
        name="xLabel"
        onChange={event => onChangeSpec({
          axisLabelX: event.target.value.toString(),
          axisLabelXFromUser: true,
        })}
      />
      <Subtitle>Aggregation</Subtitle>
      <SelectInput
        placeholder="Select a data column to group by"
        labelText="Bucket column"
        choice={spec.bucketColumn !== null ?
          spec.bucketColumn.toString() : null}
        name="xGroupColumnMenu"
        options={columnOptions}
        clearable
        onChange={(value) => {
          const change = { bucketColumn: value };

          if (spec.metricColumnY !== null) {
            change.axisLabelX = getAxisLabel('x', Object.assign({}, spec, change), columnOptions);
            change.axisLabelY = getAxisLabel('y', Object.assign({}, spec, change), columnOptions);
          }
          onChangeSpec(change);
        }}
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
        onChange={(value) => {
          const change = { metricAggregation: value };

          if (spec.metricColumnY !== null) {
            change.axisLabelX = getAxisLabel('x', Object.assign({}, spec, change), columnOptions);
            change.axisLabelY = getAxisLabel('y', Object.assign({}, spec, change), columnOptions);
          }
          onChangeSpec(change);
        }}
      />
      <Subtitle>Popup Label</Subtitle>
      <SelectInput
        placeholder="Select a popup label column"
        labelText="Popup label column"
        choice={getPopupLabelChoice(spec)}
        name="datapointLabelColumnMenu"
        options={columnOptions}
        clearable
        onChange={value => onChangeSpec({ datapointLabelColumn: value })}
        disabled={spec.bucketColumn !== null}
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
};
