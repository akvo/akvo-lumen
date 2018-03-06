import React from 'react';
import PropTypes from 'prop-types';

import SelectInput from '../SelectInput';
import { filterColumns } from '../../../../utilities/utils';

const geopoint = { 'data-test-id': 'geopoint-select' };
const colorCoding = { 'data-test-id': 'color-coding-select' };

const GeopointDataTab = (props) => {
  const { layer,
    layerIndex,
    onChangeMapLayer,
    columnOptions,
    handlePointColorColumnChange,
    disabled,
  } = props;

  return (
    <div className="GeopointDataTab">
      {(layer.latitude != null || layer.longitude != null) &&
        <div>
          <div className="inputGroup">
            <SelectInput
              disabled={layer.datasetId === null || disabled}
              placeholder="Select a latitude column"
              labelText="Latitude column"
              choice={layer.latitude != null ? layer.latitude.toString() : null}
              name="latitudeInput"
              options={filterColumns(columnOptions, 'number')}
              onChange={value => onChangeMapLayer(layerIndex, {
                latitude: value,
              })}
            />
          </div>
          <div className="inputGroup">
            <SelectInput
              disabled={layer.datasetId === null || disabled}
              placeholder="Select a longitude column"
              labelText="Longitude column"
              choice={layer.longitude != null ? layer.longitude.toString() : null}
              name="longitudeInput"
              options={filterColumns(columnOptions, 'number')}
              onChange={value => onChangeMapLayer(layerIndex, {
                longitude: value,
              })}
            />
          </div>
          <hr />
        </div>
      }
      <div className="inputGroup">
        <SelectInput
          disabled={layer.datasetId === null || disabled}
          placeholder="Select a geopoint column"
          labelText="Geopoint column"
          choice={layer.geom != null ? layer.geom.toString() : null}
          name="geomInput"
          options={filterColumns(columnOptions, 'geopoint')}
          onChange={value => onChangeMapLayer(layerIndex, {
            geom: value,
            latitude: null,
            longitude: null,
          })}
          inputProps={geopoint}
        />
      </div>
      <div className="inputGroup">
        <SelectInput
          disabled={
            ((layer.latitude == null || layer.longitude == null) && layer.geom == null) ||
            disabled
          }
          placeholder="Select a data column to color points by"
          labelText="Color coding column"
          choice={layer.pointColorColumn != null ?
            layer.pointColorColumn.toString() : null}
          name="xGroupColumnMenu"
          options={filterColumns(columnOptions, ['text', 'number'])}
          clearable
          onChange={columnName =>
            handlePointColorColumnChange(columnName,
              columnOptions.find(option => option.value === columnName))}
          inputProps={colorCoding}
        />
      </div>
    </div>
  );
};

GeopointDataTab.propTypes = {
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  handlePointColorColumnChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default GeopointDataTab;
