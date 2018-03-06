import React from 'react';
import PropTypes from 'prop-types';
import ButtonRowInput from '../ButtonRowInput';
import ColorLabels from '../ColorLabels';

const GeopointThemeTab = (props) => {
  const {
    onChangeMapLayer,
    columnOptions,
    layer,
    layerIndex,
    pointColorMapping,
    handleChangeLabelColor,
    disabled,
  } = props;

  return (
    <div
      className="themeTab"
    >
      <ButtonRowInput
        options={['1', '2', '3', '4', '5'].map(item => ({
          label: item,
          value: item,
        }))}
        disabled={disabled}
        selected={layer.pointSize ? layer.pointSize.toString() : null}
        label="Point size"
        onChange={option => onChangeMapLayer(layerIndex, { pointSize: option })}
      />
      <hr />
      <h3>Color</h3>
      {Boolean(pointColorMapping && pointColorMapping.length) &&
        <div className="inputGroup">
          <label
            htmlFor="colors"
          >
            Colors ({columnOptions.find(obj => obj.value === layer.pointColorColumn).title})
          </label>
          <ColorLabels
            disabled={disabled}
            id="colors"
            pointColorMapping={pointColorMapping}
            onChangeColor={
              (value, newColor) => handleChangeLabelColor(pointColorMapping, value, newColor)
            }
          />
        </div>
      }
    </div>
  );
};

GeopointThemeTab.propTypes = {
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  handleChangeLabelColor: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  pointColorMapping: PropTypes.array.isRequired,
  columnOptions: PropTypes.array.isRequired,
};
