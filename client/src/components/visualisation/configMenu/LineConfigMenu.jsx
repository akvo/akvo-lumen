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
    if (spec.metricColumnX == null) {
      newAxisLabel = 'Dataset row number';
    } else {
      newAxisLabel = getColumnTitle(spec.metricColumnX, columnOptions);
    }
  } else {
    newAxisLabel = getColumnTitle(spec.metricColumnY, columnOptions);

    if (spec.metricAggregation != null) {
      newAxisLabel += ` - ${spec.metricAggregation}`;
    }
  }

  return newAxisLabel;
};

export default function LineConfigMenu(props) {
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
        onChange={value => onChangeSpec({
          metricColumnY: value,
          axisLabelY: getAxisLabel('y', Object.assign({}, spec, { metricColumnY: value }), columnOptions),
          axisLabelX: getAxisLabel('x', Object.assign({}, spec, { metricColumnY: value }), columnOptions),
        })}
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
        name="metricColumnXInput"
        options={columnOptions}
        onChange={value => onChangeSpec({
          metricColumnX: value,
          axisLabelX: getAxisLabel('x', Object.assign({}, spec, { metricColumnX: value }), columnOptions),
        })}
        clearable
      />
      <SelectInput
        placeholder={spec.metricColumnX !== null ?
          'Choose aggregation type...' : 'Must choose X-Axis column first'}
        labelText="Aggregation type"
        choice={(spec.metricColumnX !== null && spec.metricAggregation != null) ?
          spec.metricAggregation.toString() : null}
        name="metricAggregationInput"
        options={aggregationOptions}
        clearable
        disabled={spec.metricColumnY === null || spec.metricColumnX === null}
        onChange={value => onChangeSpec({
          metricAggregation: value,
          axisLabelY: getAxisLabel('y', Object.assign({}, spec, { metricAggregation: value }), columnOptions),
        })}
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
    </div>
  );
}

LineConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  aggregationOptions: PropTypes.array.isRequired,
};
