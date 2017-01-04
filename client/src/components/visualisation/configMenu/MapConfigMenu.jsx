import React, { PropTypes } from 'react';
import SelectInput from './SelectInput';
import Subtitle from './Subtitle';

export default function MapConfigMenu(props) {
  const {
    visualisation,
    onChangeSpec,
    columnOptions,
    getColumnMetadata,
  } = props;
  const spec = visualisation.spec;

  return (
    <div>
      <Subtitle>Latitude</Subtitle>
      <SelectInput
        placeholder="Select a latitude column"
        labelText="Latitude column"
        choice={spec.metricColumnX !== null ? spec.metricColumnX.toString() : null}
        name="xColumnInput"
        options={columnOptions.filter(column => column.type === 'number')}
        onChange={value => onChangeSpec({
          metricColumnX: value,
          metricColumnXType: getColumnMetadata('type', value, columnOptions),
        })}
      />
      <Subtitle>Longitude</Subtitle>
      <SelectInput
        placeholder="Select a longitude column"
        labelText="Longitude column"
        choice={spec.metricColumnY !== null ? spec.metricColumnY.toString() : null}
        name="yColumnInput"
        options={columnOptions.filter(column => column.type === 'number')}
        onChange={value => onChangeSpec({
          metricColumnY: value,
          metricColumnYType: getColumnMetadata('type', value, columnOptions),
        })}
      />
      <Subtitle>Popup Label</Subtitle>
      <SelectInput
        placeholder="Select a popup label column"
        labelText="Popup label column"
        choice={spec.datapointLabelColumn !== null ? spec.datapointLabelColumn.toString() : null}
        name="xNameColumnMenu"
        options={columnOptions}
        clearable
        onChange={value => onChangeSpec({
          datapointLabelColumn: value,
          datapointLabelColumnType: getColumnMetadata('type', value, columnOptions),
        })}
      />
      <Subtitle>Point color</Subtitle>
      <SelectInput
        placeholder="Select a data column to color points by"
        labelText="Point color column"
        choice={spec.pointColorColumn !== null ?
          spec.pointColorColumn.toString() : null}
        name="xGroupColumnMenu"
        options={columnOptions}
        clearable
        onChange={value => onChangeSpec({
          pointColorColumn: value,
          pointColorName: getColumnMetadata('title', value, columnOptions),
          pointColorType: getColumnMetadata('type', value, columnOptions),
        })}
      />
    </div>
  );
}

MapConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  aggregationOptions: PropTypes.array.isRequired,
  getColumnMetadata: PropTypes.func.isRequired,
};
