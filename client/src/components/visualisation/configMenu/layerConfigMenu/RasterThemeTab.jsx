import React from 'react';
import PropTypes from 'prop-types';

import ColorLabels from '../ColorLabels';
import { palette } from '../../../../utilities/visualisationColors';

const RasterThemeTab = (props) => {
  const {
    onChangeMapLayer,
    layerIndex,
    disabled,
    startColor,
    endColor,
  } = props;

  return (
    <div
      className="themeTab"
    >
      <ColorLabels
        pointColorMapping={[{ value: 'startColor', color: startColor || '#FFFFFF' }, { value: 'endColor', color: endColor || '#000000' }]}
        colorPalette={palette}
        disabled={disabled}
        onChangeColor={(value, color) => {
          if (value === 'startColor') {
            onChangeMapLayer(layerIndex, { startColor: color });
          } else {
            onChangeMapLayer(layerIndex, { endColor: color });
          }
        }}
      />
    </div>
  );
};

RasterThemeTab.propTypes = {
  startColor: PropTypes.string,
  endColor: PropTypes.string,
  onChangeMapLayer: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  layerIndex: PropTypes.number.isRequired,
};

export default RasterThemeTab;
