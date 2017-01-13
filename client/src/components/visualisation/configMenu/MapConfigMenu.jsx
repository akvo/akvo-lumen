import React, { PropTypes, Component } from 'react';
import { GithubPicker } from 'react-color';
import SelectInput from './SelectInput';
import Subtitle from './Subtitle';
import { getPointColorValues } from '../../../utilities/chart';
import defaultColors from '../../../utilities/defaultColors';

class LabelItem extends Component {
  constructor() {
    super();
    this.state = { displayColorPicker: false };
  }

  handleOnChangeColor(newColor) {
    this.setState({ displayColorPicker: false });
    this.props.onChangeColor(newColor);
  }

  render() {
    const { color, value } = this.props;
    const { displayColorPicker } = this.state;
    return (
      <span>
        <span
          onClick={() => this.setState({ displayColorPicker: true })}
          style={{
            display: 'inline-block',
            backgroundColor: color,
            width: '1rem',
            height: '1rem',
          }}
        >
          {displayColorPicker &&
            <GithubPicker
              color={color}
              onChangeComplete={evt => this.handleOnChangeColor(evt.hex)}
            />}
        </span>
        {' '}
        {value}
      </span>
    );
  }
}

LabelItem.propTypes = {
  color: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChangeColor: PropTypes.func.isRequired,
};

function Labels({ pointColorMapping, onChangeColor }) {
  return (
    <ul>
      {pointColorMapping.map(({ color, value }, idx) =>
        <li key={idx}>
          <LabelItem
            color={color}
            value={value}
            onChangeColor={newColor => onChangeColor(value, newColor)}
          />
        </li>
      )}
    </ul>
  );
}

Labels.propTypes = {
  pointColorMapping: PropTypes.array.isRequired,
  onChangeColor: PropTypes.func.isRequired,
};

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
    const values = getPointColorValues(dataset, columnName, visualisation.spec.filters);

    this.props.onChangeSpec({
      pointColorColumn: columnName,
      pointColorMapping: values.map((value, index) => ({
        op: 'equals',
        value,
        color: defaultColors[index] || '#000000',
      })),
    });
  }

  handleChangeLabelColor(value, color) {
    const pointColorMapping = this.props.visualisation.spec.pointColorMapping;

    this.props.onChangeSpec({
      pointColorMapping: pointColorMapping.map((mapping) => {
        if (mapping.value === value) {
          return Object.assign({}, mapping, { color });
        }
        return mapping;
      }),
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
        { spec.pointColorColumn &&
          <Labels
            pointColorMapping={spec.pointColorMapping}
            onChangeColor={(value, newColor) => this.handleChangeLabelColor(value, newColor)}
          />
        }
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
