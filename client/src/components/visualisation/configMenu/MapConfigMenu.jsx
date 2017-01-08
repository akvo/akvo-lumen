import React, { PropTypes, Component } from 'react';
import SelectInput from './SelectInput';
import Subtitle from './Subtitle';
import defaultColors from '../../../utilities/defaultColors';

function uniqueValues(dataset, columnName) {
  const columnIndex = dataset.get('columns').findIndex(
    column => column.get('columnName') === columnName
  );
  return dataset.get('rows').map(row => row.get(columnIndex)).toSet().toArray();
}

export default class MapConfigMenu extends Component {

  handlePopupChange(columnNames) {
    const popup = columnNames.map(columnName => ({
      column: columnName,
    }));
    this.props.onChangeSpec({ popup });
  }

  handlePointColorColumnChange(columnName) {
    const { datasets, visualisation } = this.props;
    const dataset = datasets[visualisation.datasetId];
    const values = uniqueValues(dataset, columnName);

    this.props.onChangeSpec({
      pointColorColumn: columnName,
      pointColorMapping: values.map((value, index) => ({
        op: 'equals',
        value,
        color: defaultColors[index],
      })),
    });
  }

  render() {
    const {
      visualisation,
      onChangeSpec,
      columnOptions,
    } = this.props;
    const spec = visualisation.spec;

    return (
      <div>
        <Subtitle>Latitude</Subtitle>
        <SelectInput
          placeholder="Select a latitude column"
          labelText="Latitude column"
          choice={spec.latitude !== null ? spec.latitude.toString() : null}
          name="xColumnInput"
          options={columnOptions.filter(column => column.type === 'number')}
          onChange={value => onChangeSpec({
            latitude: value,
          })}
        />
        <Subtitle>Longitude</Subtitle>
        <SelectInput
          placeholder="Select a longitude column"
          labelText="Longitude column"
          choice={spec.longitude !== null ? spec.longitude.toString() : null}
          name="yColumnInput"
          options={columnOptions.filter(column => column.type === 'number')}
          onChange={value => onChangeSpec({
            longitude: value,
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
          onChange={columnName => this.handlePointColorColumnChange(columnName)}
        />
        <Subtitle>Popup</Subtitle>
        <SelectInput
          options={columnOptions}
          choice={spec.popup.map(entry => entry.column)}
          multi
          labelText="Popup column"
          onChange={options => this.handlePopupChange(options.map(opt => opt.value))}
          name="popupInput"
        />
      </div>
    );
  }
}

MapConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  aggregationOptions: PropTypes.array.isRequired,
  getColumnMetadata: PropTypes.func.isRequired,
};
