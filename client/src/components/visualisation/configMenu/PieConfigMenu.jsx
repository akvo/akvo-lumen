import React from 'react';
import PropTypes from 'prop-types';
import SelectInput from './SelectInput';
import LabelInput from './LabelInput';
import ToggleInput from './ToggleInput';

require('../../../styles/PieConfigMenu.scss');

export default function PieConfigMenu(props) {
  const {
    visualisation,
    onChangeSpec,
    columnOptions,
  } = props;
  const spec = visualisation.spec;

  return (
    <div className="PieConfigMenu">
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
          legendTitle: columnOptions.find(item => item.value === value) ?
            columnOptions.find(item => item.value === value).title : null,
        })}
      />
      <ToggleInput
        name="showLegend"
        type="checkbox"
        label="Show legend"
        className="showLegend"
        checked={Boolean(spec.showLegend)}
        onChange={val => onChangeSpec({
          showLegend: val,
        })}
      />
      <LabelInput
        value={spec.legendTitle != null ? spec.legendTitle.toString() : null}
        placeholder="Legend title"
        name="legendLabel"
        maxLength={32}
        onChange={event => onChangeSpec({
          legendTitle: event.target.value.toString(),
        }, spec, onChangeSpec, columnOptions)}
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
