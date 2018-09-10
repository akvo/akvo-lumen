import React from 'react';
import PropTypes from 'prop-types';

import { filterColumns } from '../../../utilities/utils';
import ConfigMenuSection from '../../common/ConfigMenu/ConfigMenuSection';
import ConfigMenuSectionOptionText from '../../common/ConfigMenu/ConfigMenuSectionOptionText';
import ConfigMenuSectionOptionSelect from '../../common/ConfigMenu/ConfigMenuSectionOptionSelect';

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
      <ConfigMenuSection
        title="y_axis"
        options={(
          <ConfigMenuSectionOptionSelect
            placeholderId="select_a_metric_column"
            labelTextId="metric_column"
            value={spec.metricColumnY !== null ? spec.metricColumnY.toString() : null}
            name="yColumnInput"
            options={filterColumns(columnOptions, ['number', 'date'])}
            onChange={(value) => {
              const change = { metricColumnY: value };

              if (spec.metricColumnX !== null) {
                change.axisLabelX = getAxisLabel('x', Object.assign({}, spec, change), columnOptions);
                change.axisLabelY = getAxisLabel('y', Object.assign({}, spec, change), columnOptions);
              }
              onChangeSpec(change);
            }}
          />
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
          <ConfigMenuSectionOptionSelect
            placeholderId="select_a_metric_column"
            labelTextId="metric_column"
            value={spec.metricColumnX !== null ? spec.metricColumnX.toString() : null}
            name="xColumnInput"
            options={filterColumns(columnOptions, ['number', 'date'])}
            onChange={(value) => {
              const change = { metricColumnX: value };

              if (spec.metricColumnY !== null) {
                change.axisLabelX = getAxisLabel('x', Object.assign({}, spec, change), columnOptions);
                change.axisLabelY = getAxisLabel('y', Object.assign({}, spec, change), columnOptions);
              }
              onChangeSpec(change);
            }}
          />
        )}
        advancedOptions={(
          <ConfigMenuSectionOptionText
            value={spec.axisLabelX !== null ? spec.axisLabelX.toString() : null}
            placeholderId="x_axis_label"
            name="xLabel"
            onChange={event => onChangeSpec({
              axisLabelX: event.target.value.toString(),
              axisLabelXFromUser: true,
            })}
          />
        )}
      />

      <ConfigMenuSection
        title="aggregation"
        options={(
          <div>
            <ConfigMenuSectionOptionSelect
              placeholderId="select_a_data_column_to_group_by"
              labelTextId="bucket_column"
              value={spec.bucketColumn !== null ?
                spec.bucketColumn.toString() : null}
              name="xGroupColumnMenu"
              options={filterColumns(columnOptions, ['number', 'date', 'text'])}
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
            <ConfigMenuSectionOptionSelect
              placeholderId={spec.bucketColumn !== null ?
                'choose_aggregation_type' : 'must_choose_bucket_column_first'}
              labelTextId="aggregation_type"
              value={spec.bucketColumn !== null ?
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
          </div>
        )}
      />

      <ConfigMenuSection
        title="popup_label"
        options={(
          <div>
            <ConfigMenuSectionOptionSelect
              placeholderId="select_a_popup_label_column"
              labelTextId="popup_label_column"
              value={getPopupLabelChoice(spec)}
              name="datapointLabelColumnMenu"
              options={filterColumns(columnOptions, ['number', 'date', 'text'])}
              clearable
              onChange={value => onChangeSpec({ datapointLabelColumn: value })}
              disabled={spec.bucketColumn !== null}
            />
          </div>
        )}
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
