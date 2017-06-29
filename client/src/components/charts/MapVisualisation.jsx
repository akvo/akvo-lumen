import React from 'react';
import PropTypes from 'prop-types';
import { Map, CircleMarker, Popup, TileLayer } from 'react-leaflet';
import * as chart from '../../utilities/chart';
import * as mv from '../../utilities/mapVisualisation';

require('../../../node_modules/leaflet/dist/leaflet.css');
require('./MapVisualisation.scss');

const DataLayer = ({ displayLayer }) => {
  const { chartValues } = displayLayer;
  const radius = 2 + (parseInt(displayLayer.pointSize, 10) * 2);

  return (
    <div>
      {chartValues.map((entry, index) =>
        <CircleMarker
          center={[entry.latitude, entry.longitude]}
          radius={radius}
          fillColor={entry.pointColor || '#000000'}
          fillOpacity={1}
          opacity={1}
          color="#FFFFFF"
          weight={1}
          key={index}
        >
          {entry.popup.length > 0 &&
          <Popup>
            <ul
              className="popupContainer"
            >
              {entry.popup.map((popupObject, popupIndex) =>
                <li
                  className="popupItem"
                  key={popupIndex}
                >
                  <h4>
                    {popupObject.title}
                  </h4>
                  <span>
                    {mv.isImage(popupObject.value) ?
                      <a
                        href={popupObject.value}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="imageContainer">
                          <img
                            src={popupObject.value}
                            role="presentation"
                          />
                        </div>
                      </a>
                          :
                      <span>
                        {popupObject.value}
                      </span>
                        }
                  </span>
                </li>
                )}
            </ul>
          </Popup>
            }
        </CircleMarker>
        )
      }
    </div>
  );
};

DataLayer.propTypes = {
  displayLayer: PropTypes.object.isRequired,
};

export default function MapVisualisation({ visualisation, datasets, width, height }) {
  const displayLayers = mv.getDataLayers(visualisation.spec.layers, datasets);
  const bounds = mv.calculateBounds(displayLayers);
  const title = visualisation.name || '';
  const titleLength = title.toString().length;
  const titleHeight = titleLength > 48 ? 56 : 36;
  const mapHeight = height - titleHeight;
  const { tileUrl, tileAttribution } = mv.getBaseLayerAttributes(visualisation.spec.baseLayer);

  return (
    <div
      className="MapVisualisation dashChart"
      style={{
        width,
        height,
      }}
    >
      {displayLayers.map((displayLayer, outerIndex) =>
        <div
          className="legendContainer"
          key={outerIndex}
        >
          {(displayLayer.pointColorMapping &&
            displayLayer.pointColorMapping.length > 0 &&
            displayLayer.legend.visible) &&
            <div
              className={`legend ${displayLayer.legend.position}`}
            >
              <h4>{displayLayer.legend.title}</h4>
              <ul>
                {displayLayer.pointColorMapping.map((mappingEntry, innerIndex) =>
                  <li
                    className="legendEntry"
                    key={innerIndex}
                  >
                    <i
                      className="colorIndicator"
                      style={{
                        backgroundColor: mappingEntry.color,
                      }}
                    />
                    <span
                      className={`colorLabel
                        ${chart.replaceLabelIfValueEmpty(mappingEntry.value, true)}`}
                    >
                      {chart.replaceLabelIfValueEmpty(mappingEntry.value)}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          }
        </div>
      )}
      <h2
        style={{
          height: titleHeight,
          lineHeight: titleLength > 96 ? '16px' : '20px',
          fontSize: titleLength > 96 ? '14px' : '16px',
        }}
      >
        <span>
          {visualisation.name}
        </span>
      </h2>
      <Map
        center={[0, 0]}
        {... bounds ? { bounds } : {}} // Do not set a bounds prop if we have no bounds
        zoom={2}
        scrollWheelZoom={false}
        key={width}
        style={{
          width,
          height: mapHeight,
        }}
      >
        <TileLayer
          key={tileUrl}
          url={tileUrl}
          attribution={tileAttribution}
        />
        {displayLayers.map((displayLayer, index) =>
          <DataLayer
            key={index}
            displayLayer={displayLayer}
          />
        )}
      </Map>
    </div>
  );
}

MapVisualisation.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};
