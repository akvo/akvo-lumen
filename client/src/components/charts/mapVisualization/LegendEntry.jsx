import React from 'react';
import PropTypes from 'prop-types';

import * as chart from '../../../utilities/chart';

// returns true if we need to set "word-break: break-all" on el to avoid x-overflow
const wrapLabel = (str) => {
  if (!str) {
    return false;
  }
  return Boolean(str.toString().split(' ').some(word => word.length > 18));
};

const LegendEntry = ({ singleMetadata, layer }) => (
  <div className="LegendEntry">
    {Boolean(singleMetadata.pointColorMapping) &&
      <div className="container">
        <h4>{layer.title}</h4>
        <h5>{`${singleMetadata.pointColorMappingTitle}`}</h5>
        <div className="listContainer">
          <ul>
            {singleMetadata.pointColorMapping.map(item =>
              <li
                key={item.value}
              >
                <div
                  className="colorMarker"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
                <p className={`label ${wrapLabel(item.value) ? 'breakAll' : ''}`}>
                  {chart.replaceLabelIfValueEmpty(item.value)}
                </p>
              </li>
              )}
          </ul>
        </div>
      </div>
    }
    {Boolean(singleMetadata.shapeColorMapping) &&
      <div className="container">
        <h4>{layer.title}</h4>
        <h5>{singleMetadata.shapeColorMappingTitle}</h5>
        <div className="contents">
          <div className="gradientContainer">
            <p className="gradientLabel min">
              Min
            </p>
            <p className="gradientLabel max">
              Max
            </p>
            <div
              className="gradientDisplay"
              style={{
                background: `linear-gradient(90deg,${singleMetadata.shapeColorMapping.map(o => o.color).join(',')})`,
              }}
            />
          </div>
        </div>
      </div>
    }
    {Boolean(layer.layerType === 'raster') &&
      <div className="container">
        <h4>{layer.title}</h4>
        <h5>Raster layer</h5>
        <div className="contents">
          <div className="gradientContainer">
            <p className="gradientLabel min">
              {singleMetadata.min !== undefined ? chart.round(singleMetadata.min, 2) : 'Min'}
            </p>
            <p className="gradientLabel max">
              {singleMetadata.max !== undefined ? chart.round(singleMetadata.max, 2) : 'Max'}
            </p>
            <div
              className="gradientDisplay"
              style={{
                background: `linear-gradient(90deg,${layer.startColor || 'white'},${layer.endColor || 'black'})`,
              }}
            />
          </div>
        </div>
      </div>
    }
  </div>
);

LegendEntry.propTypes = {
  singleMetadata: PropTypes.object,
  layer: PropTypes.object,
};

export default LegendEntry;
