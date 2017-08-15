import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
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
      <Subtitle><FormattedMessage id="y_axis" /></Subtitle>
      <SelectInput
        placeholderId="select_a_metric_column"
        labelTextId="metric_column"
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
        placeholderId="y_axis_label"
        name="yLabel"
        onChange={event => onChangeSpec({
          axisLabelY: event.target.value.toString(),
          axisLabelYFromUser: true,
        })}
      />
      <Subtitle><FormattedMessage id="x_axis" /></Subtitle>
      <SelectInput
        placeholderId="select_a_metric_column"
        labelTextId="metric_column"
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
        placeholderId="x_axis_label"
        name="xLabel"
        onChange={event => onChangeSpec({
          axisLabelX: event.target.value.toString(),
          axisLabelXFromUser: true,
        })}
      />
      <Subtitle><FormattedMessage id="aggregation" /></Subtitle>
      <SelectInput
        placeholderId="select_a_data_column_to_group_by"
        labelTextId="bucket_column"
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
        placeholderId={spec.bucketColumn !== null ?
          'choose_aggregation_type' : 'must_choose_bucket_column_first'}
        labelTextId="aggregation_type"
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
      <Subtitle><FormattedMessage id="popup_label" /></Subtitle>
      <SelectInput
        placeholderId="select_a_popup_label_column"
        labelTextId="popup_label_column"
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
