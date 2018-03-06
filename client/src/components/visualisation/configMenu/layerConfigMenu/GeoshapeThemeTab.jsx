import React from 'react';
import PropTypes from 'prop-types';
import ColorLabels from '../ColorLabels';

const GeoshapeThemeTab = (props) => {
  const {
    onChangeMapLayer,
    layerIndex,
    colors,
    gradientColor,
    disabled,
  } = props;

  return (
    <div
      className="themeTab"
    >
      {colors &&
        <ColorLabels
          pointColorMapping={[{ value: 'Gradient color', color: gradientColor }]}
          colorPalette={colors}
          disabled={disabled}
          onChangeColor={(ignore, color) => onChangeMapLayer(layerIndex, { gradientColor: color })}
        />
      }
    </div>
  );
};

GeoshapeThemeTab.propTypes = {
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  colors: PropTypes.array,
  gradientColor: PropTypes.string,
  disabled: PropTypes.bool,
};

export default GeoshapeThemeTab;
