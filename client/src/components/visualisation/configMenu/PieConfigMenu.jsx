import React from 'react';
import PropTypes from 'prop-types';

import ToggleInput from '../../common/ToggleInput';
import { filterColumns } from '../../../utilities/utils';
import ConfigMenuSection from '../../common/ConfigMenu/ConfigMenuSection';
import ConfigMenuSectionOptionText from '../../common/ConfigMenu/ConfigMenuSectionOptionText';
import ConfigMenuSectionOptionSelect from '../../common/ConfigMenu/ConfigMenuSectionOptionSelect';

export default function PieConfigMenu(props) {
  const {
    visualisation,
    onChangeSpec,
    columnOptions,
  } = props;
  const spec = visualisation.spec;

  return (
    <div className="PieConfigMenu">
      <ConfigMenuSection
        title="bucket_column"
        options={(
          <ConfigMenuSectionOptionSelect
            placeholderId="select_a_data_column_to_group_by"
            value={spec.bucketColumn !== null ?
              spec.bucketColumn.toString() : null}
            name="xGroupColumnMenu"
            options={filterColumns(columnOptions, ['number', 'date', 'text'])}
            clearable
            onChange={value => onChangeSpec({
              bucketColumn: value,
              legendTitle: columnOptions.find(item => item.value === value) ?
                columnOptions.find(item => item.value === value).title : null,
            })}
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
                <ConfigMenuSectionOptionText
                  value={spec.legendTitle != null ? spec.legendTitle.toString() : null}
                  placeholderId="legend_title"
                  name="legendLabel"
                  maxLength={32}
                  onChange={event => onChangeSpec({
                    legendTitle: event.target.value.toString(),
                  }, spec, onChangeSpec, columnOptions)}
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
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  aggregationOptions: PropTypes.array.isRequired,
};
