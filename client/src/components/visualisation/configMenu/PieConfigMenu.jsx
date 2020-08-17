import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';
import get from 'lodash/get';

import ButtonRowInput from './ButtonRowInput';
import ToggleInput from '../../common/ToggleInput';
import { filterColumns } from '../../../utilities/column';
import ConfigMenuSection from '../../common/ConfigMenu/ConfigMenuSection';
import ConfigMenuSectionOptionText from '../../common/ConfigMenu/ConfigMenuSectionOptionText';
import ConfigMenuSectionOptionSelect from '../../common/ConfigMenu/ConfigMenuSectionOptionSelect';
import { LegendsSortable, resetLegend } from '../../charts/LegendsSortable';

function PieConfigMenu(props) {
  const {
    visualisation,
    onChangeSpec,
    columnOptions,
    intl,
  } = props;
  const spec = visualisation.spec;
  const specLegend = spec.legend || {};
  return (
    <div className="PieConfigMenu">
      <ConfigMenuSection
        title="bucket_column"
        options={(
          <ConfigMenuSectionOptionSelect
            placeholderId="select_a_data_column_to_group_by"
            value={spec.bucketColumn !== null ? spec.bucketColumn.toString() : null}
            name="xGroupColumnMenu"
            options={filterColumns(columnOptions, ['number', 'date', 'text', 'option'])}
            clearable
            onChange={(value) => {
              const legend = resetLegend(specLegend, visualisation);
              onChangeSpec({
                bucketColumn: value,
                legendTitle: columnOptions.find(item => item.value === value) ?
                  columnOptions.find(item => item.value === value).title : null,
                legend,
              });
            }}
          />
        )}
        advancedOptions={(
          <div>
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
                {Boolean(props.env.environment.orderedLegend) && (
                  <div style={{ marginBottom: '20px' }}>
                    <ButtonRowInput
                      labelClass="label"
                      options={[{
                        label: <FormattedMessage id="legend_order_auto_mode" />,
                        value: 'auto',
                      }, {
                        label: <FormattedMessage id="legend_order_custom_mode" />,
                        value: 'custom',
                      }]}
                      selected={get(spec, 'legend.order.mode') || 'auto'}
                      label={intl.formatMessage({ id: 'legend_category_order' })}
                      onChange={(val) => {
                        const legend = resetLegend(specLegend, visualisation, val);
                        onChangeSpec({ legend });
                      }}
                      buttonSpacing="0"
                    />
                    <LegendsSortable
                      onChangeSpec={onChangeSpec}
                      visualisation={visualisation}
                      colors={spec.colors}
                      specLegend={specLegend}
                    />
                  </div>)}
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
            <ToggleInput
              name="showLabels"
              type="checkbox"
              labelId="show_labels"
              className="InputGroup"
              checked={Boolean(spec.showLabels)}
              onChange={val => onChangeSpec({
                showLabels: val,
              })}
            />
          </div>
        )}
      />
    </div>
  );
}

PieConfigMenu.propTypes = {
  intl: intlShape.isRequired,
  visualisation: PropTypes.object.isRequired,
  env: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  aggregationOptions: PropTypes.array.isRequired,
};

export default injectIntl(PieConfigMenu);
