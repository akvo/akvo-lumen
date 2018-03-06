import React from 'react';
import PropTypes from 'prop-types';

import LegendEntry from './LegendEntry';

const Legend = ({ layers, layerMetadata }) => {
  const legendLayers = layers.map((layer, idx) => {
    const metadata = layerMetadata[idx];
    const showLayer =
      Boolean(
        layer.legend.visible &&
        metadata &&
        (metadata.pointColorMapping || metadata.shapeColorMapping)
      ) ||
      layer.layerType === 'raster';

    return showLayer ? layer : null;
  });

  return (
    <div
      className={'Legend'}
    >
      <div className="container">
        {
          legendLayers.map((layer, idx) => {
            const haveLayer = Boolean(layer);
            if (!haveLayer) {
              return null;
            }
            return (
              <LegendEntry
                key={idx}
                layer={layer}
                singleMetadata={layerMetadata[idx]}
              />
            );
          })
        }
      </div>
    </div>
  );
};

Legend.propTypes = {
  layers: PropTypes.array,
  layerMetadata: PropTypes.array,
};

export default Legend;
