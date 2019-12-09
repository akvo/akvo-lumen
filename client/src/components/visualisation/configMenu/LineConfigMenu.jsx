import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import ConfigMenuSection from '../../common/ConfigMenu/ConfigMenuSection';
import ConfigMenuSectionOptionText from '../../common/ConfigMenu/ConfigMenuSectionOptionText';
import ConfigMenuSectionOptionSelect from '../../common/ConfigMenu/ConfigMenuSectionOptionSelect';
import { filterColumns } from '../../../utilities/column';

const getColumnTitle = (columnName, columnOptions) =>
  get(columnOptions.find(obj => obj.value === columnName), 'title');

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
      <ConfigMenuSection
        title="y_axis"
        options={(
          <div data-test-id="y-axis-select">
            <ConfigMenuSectionOptionSelect
              placeholderId="select_a_metric_column"
              labelTextId="metric_column"
              value={spec.metricColumnY !== null ? spec.metricColumnY.toString() : null}
              name="metricColumnYInput"
              options={filterColumns(columnOptions, ['number', 'text'])}
              onChange={value => onChangeSpec({
                metricColumnY: value,
                axisLabelY: getAxisLabel('y', Object.assign({}, spec, { metricColumnY: value }), columnOptions),
                axisLabelX: getAxisLabel('x', Object.assign({}, spec, { metricColumnY: value }), columnOptions),
              })}
            />
          </div>
        )}
        advancedOptions={(
          <ConfigMenuSectionOptionText
            value={spec.axisLabelY !== null ? spec.axisLabelY.toString() : null}
            placeholderId="y_axis_label"
            name="yLabel"
            onChange={event => onChangeSpec({
              axisLabelY: event.target.value.toString(),
              axisLabelYFromUser: true,
            })}
          />
        )}
      />

      <ConfigMenuSection
        title="x_axis"
        options={(
          <div data-test-id="x-axis-select">
            <ConfigMenuSectionOptionSelect
              placeholderId="select_a_metric_column"
              labelTextId="metric_column"
              value={spec.metricColumnX !== null ? spec.metricColumnX.toString() : null}
              name="metricColumnXInput"
              options={filterColumns(columnOptions, ['number', 'date'])}
              onChange={value => onChangeSpec({
                metricColumnX: value,
                axisLabelX: getAxisLabel('x', Object.assign({}, spec, { metricColumnX: value }), columnOptions),
              })}
              clearable
            />
          </div>
        )}
        advancedOptions={(
          <div>
            <ConfigMenuSectionOptionText
              value={spec.axisLabelX !== null ? spec.axisLabelX.toString() : null}
              placeholderId="x_axis_label"
              name="xLabel"
              onChange={event => onChangeSpec({
                axisLabelX: event.target.value.toString(),
                axisLabelXFromUser: true,
              })}
            />
            <ConfigMenuSectionOptionSelect
              placeholderId={(spec.metricColumnX !== null && spec.metricColumnY !== null) ?
                'choose_aggregation_type' : 'must_choose_x_axis_column_first'}
              labelTextId="aggregation_type"
              value={((spec.metricColumnX !== null && spec.metricColumnY !== null) &&
                spec.metricAggregation != null) ?
                spec.metricAggregation.toString() : null}
              name="metricAggregationInput"
              options={aggregationOptions}
              clearable
              disabled={!spec.metricColumnY || !spec.metricColumnX}
              onChange={value => onChangeSpec({
                metricAggregation: value,
                axisLabelY: getAxisLabel('y', Object.assign({}, spec, { metricAggregation: value }), columnOptions),
              })}
            />
          </div>
        )}
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
