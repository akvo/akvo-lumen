import React, { PropTypes } from 'react';
import SelectInput from './SelectInput';

export default function PieConfigMenu(props) {
  const {
    visualisation,
    onChangeSpec,
    columnOptions,
    getColumnMetadata,
  } = props;
  const spec = visualisation.spec;

  return (
    <div>
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
      <label
        htmlFor="showLegend"
      >
        Show legend
      </label>
      <input
        name="showLegend"
        type="checkbox"
        checked={spec.showLegend}
        onChange={evt => onChangeSpec({
          showLegend: evt.target.checked,
        })}
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
  getColumnMetadata: PropTypes.func.isRequired,
};
