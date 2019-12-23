import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import itsSet from 'its-set';
import { get } from 'lodash';

import { filterColumns } from '../../../utilities/column';
import ConfigMenuSection from '../../common/ConfigMenu/ConfigMenuSection';
import ToggleInput from '../../common/ToggleInput';
import ConfigMenuSectionOptionText from '../../common/ConfigMenu/ConfigMenuSectionOptionText';
import ConfigMenuSectionOptionSelect from '../../common/ConfigMenu/ConfigMenuSectionOptionSelect';

const getColumnTitle = (columnName, columnOptions) =>
  get(columnOptions.find(obj => obj.value === columnName), 'title');

const formatLabel = (spec, columnName, columnOptions) =>
  `${getColumnTitle(spec[columnName], columnOptions)}${spec.bucketColumn != null ? ` - ${spec.metricAggregation}` : ''}`;

const getAxisLabel = (axis, spec, columnOptions) => {
  if (spec[`axisLabel${axis}FromUser`]) {
    return spec[`axisLabel${axis}`];
  }

  if (axis === 'x') {
    return formatLabel(spec, 'metricColumnX', columnOptions);
  } else if (axis === 'y') {
    return formatLabel(spec, 'metricColumnY', columnOptions);
  } else if (axis === 'size') {
    return formatLabel(spec, 'metricColumnSize', columnOptions);
  }
  return '';
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

function ScatterConfigMenu(props) {
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
            clearable
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
            clearable
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
        title="category"
        options={(
          <div data-test-id="category-select">
            <ConfigMenuSectionOptionSelect
              placeholderId="select_a_data_column_to_group_by"
              labelTextId="bucket_column"
              value={
                itsSet(spec.bucketColumnCategory) ?
                  spec.bucketColumnCategory.toString() :
                  null
              }
              name="sizeColumnInput"
              clearable
              options={
                [{
                  label: props.intl.formatMessage({ id: 'select_a_data_column_to_group_by' }),
                  value: null,
                }].concat(filterColumns(columnOptions, ['number', 'text']))
              }
              onChange={(value) => {
                onChangeSpec({
                  bucketColumnCategory: value,
                  categoryLabel: get(columnOptions.find(item => item.value === value), 'title'),
                });
              }}
            />
          </div>
        )}
        advancedOptions={(
          <div>
            <ConfigMenuSectionOptionText
              value={
                itsSet(spec.categoryLabel) ?
                  spec.categoryLabel.toString() :
                  null
              }
              placeholderId="label"
              labelTextId="label"
              name="categoryLabel"
              onChange={event => onChangeSpec({
                categoryLabel: event.target.value.toString(),
                categoryLabelFromUser: true,
              })}
            />
            <ToggleInput
              name="showLegend"
              type="checkbox"
              labelId="show_legend"
              className="InputGroup"
              checked={Boolean(spec.showLegend)}
              onChange={val => onChangeSpec({
                showLegend: val,
              })}
            />
            {Boolean(spec.showLegend) && (
              <div>
                <ConfigMenuSectionOptionText
                  value={spec.legendTitle != null ? spec.legendTitle.toString() : null}
                  placeholderId="legend_title"
                  name="legendLabel"
                  maxLength={32}
                  onChange={event => onChangeSpec({
                    legendTitle: event.target.value.toString(),
                  }, spec, onChangeSpec, columnOptions)}
                />
                <ConfigMenuSectionOptionSelect
                  placeholderId="legend_position"
                  value={spec.legendPosition}
                  name="legendPosition"
                  options={[
                    {
                      label: props.intl.formatMessage({ id: 'legend_position_auto' }),
                      value: null,
                    },
                    {
                      label: props.intl.formatMessage({ id: 'legend_position_top' }),
                      value: 'top',
                    },
                    {
                      label: props.intl.formatMessage({ id: 'legend_position_right' }),
                      value: 'right',
                    },
                    {
                      label: props.intl.formatMessage({ id: 'legend_position_bottom' }),
                      value: 'bottom',
                    },
                    {
                      label: props.intl.formatMessage({ id: 'legend_position_left' }),
                      value: 'left',
                    },
                  ]}
                  clearable
                  onChange={value => onChangeSpec({ legendPosition: value })}
                />
              </div>
            )}
          </div>
        )}
      />

      <ConfigMenuSection
        title="size"
        options={(
          <div data-test-id="size-select">
            <ConfigMenuSectionOptionSelect
              placeholderId="select_a_metric_column"
              labelTextId="metric_column"
              value={
                itsSet(spec.metricColumnSize) ?
                  spec.metricColumnSize.toString() :
                  null
              }
              name="sizeColumnInput"
              clearable
              options={
                [{
                  label: props.intl.formatMessage({ id: 'select_a_metric_column' }),
                  value: null,
                }].concat(filterColumns(columnOptions, ['number', 'date']))
              }
              onChange={(value) => {
                const change = { metricColumnSize: value };
                change.sizeLabel = getAxisLabel('size', Object.assign({}, spec, change), columnOptions);
                onChangeSpec(change);
              }}
            />
          </div>
        )}
        advancedOptions={(
          <ConfigMenuSectionOptionText
            value={itsSet(spec.sizeLabel) ?
              spec.sizeLabel.toString() :
              null
            }
            placeholderId="size_label"
            name="sizeLabel"
            onChange={event => onChangeSpec({
              sizeLabel: event.target.value.toString(),
              sizeLabelFromUser: true,
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

export default injectIntl(ScatterConfigMenu);

ScatterConfigMenu.propTypes = {
  intl: intlShape.isRequired,
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  aggregationOptions: PropTypes.array.isRequired,
};
