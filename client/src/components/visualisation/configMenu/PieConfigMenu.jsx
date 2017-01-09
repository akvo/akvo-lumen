import React, { PropTypes } from 'react';
import SelectInput from './SelectInput';
import SortInput from './SortInput';

export default function PieConfigMenu(props) {
  const {
    visualisation,
    onChangeSpec,
    columnOptions,
    aggregationOptions,
    getColumnMetadata,
  } = props;
  const spec = visualisation.spec;

  return (
    <div>
      <SelectInput
        placeholder="Select a metric column"
        labelText="Metric column"
        choice={spec.metricColumnY !== null ? spec.metricColumnY.toString() : null}
        name="yColumnInput"
        options={columnOptions}
        onChange={value => onChangeSpec({
          metricColumnY: value,
          metricColumnYType: getColumnMetadata('type', value, columnOptions),
        })}
      />
      <SelectInput
        placeholder={spec.bucketColumn !== null ?
          'Choose aggregation type...' : 'Must choose "Group by" column first'}
        labelText="Aggregation type"
        choice={spec.bucketColumn !== null ?
          spec.metricAggregation.toString() : null}
        name="yAggregationMenu"
        options={aggregationOptions}
        disabled={spec.bucketColumn === null}
        onChange={value => onChangeSpec({
          metricAggregation: value,
        })}
      />
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
      <SortInput
        spec={spec}
        columnOptions={columnOptions}
        onChangeSpec={onChangeSpec}
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
