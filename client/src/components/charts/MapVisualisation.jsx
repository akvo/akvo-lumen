import React, { PropTypes } from 'react';
import { Map, CircleMarker, Popup, TileLayer } from 'react-leaflet';
import * as chart from '../../utilities/chart';

require('../../../node_modules/leaflet/dist/leaflet.css');
require('../../styles/MapVisualisation.scss');

const isImage = (value) => {
  if (typeof value === 'string' && value.match(/\.(jp(e?)g|png|gif)$/) !== null) {
    return true;
  }
  return false;
};

const calculateBounds = (layerArray) => {
  let maxLat = -90;
  let minLat = 90;
  let maxLong = -180;
  let minLong = 180;

  layerArray.forEach((layer) => {
    const bounds = layer.bounds;
    const minArray = bounds[0];
    const maxArray = bounds[1];

    minLat = Math.min(minLat, minArray[0]);
    minLong = Math.min(minLong, minArray[1]);
    maxLat = Math.max(maxLat, maxArray[0]);
    maxLong = Math.max(maxLong, maxArray[1]);
  });

  return [[minLat, minLong], [maxLat, maxLong]];
};

const getDataLayers = (layers, datasets) => {
  const displayLayers = [];

  layers.forEach((layer) => {
    if (layer.visible && layer.datasetId && layer.latitude !== null && layer.longitude !== null) {
      const chartData = chart.getMapData(layer, datasets);

      if (chartData) {
        const chartValues = chartData.values;
        const pointColorMapping = Object.keys(chartData.metadata.pointColorMapping).map(value => ({
          value,
          color: chartData.metadata.pointColorMapping[value],
        }));
        const bounds = chartData.metadata.bounds;

        displayLayers.push(Object.assign({}, layer, {
          chartValues,
          pointColorMapping,
          bounds,
        }));
      }
    }
  });

  return displayLayers;
};

const getBaseLayerAttributes = ((baseLayer) => {
  const attributes = {};

  switch (baseLayer) {
    case 'street':
      attributes.tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attributes.tileAttribution = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';
      break;

    case 'satellite':
      attributes.tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attributes.tileAttribution = 'Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community';
      break;

    case 'terrain':
      attributes.tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attributes.tileAttribution = 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';
      break;

    default:
      throw new Error(`Unknown base layer type ${baseLayer}`);
  }

  return attributes;
});

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
                    {isImage(popupObject.value) ?
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
  const displayLayers = getDataLayers(visualisation.spec.layers, datasets);
  const bounds = calculateBounds(displayLayers);
  const { tileUrl, tileAttribution } = getBaseLayerAttributes(visualisation.spec.baseLayer);

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
                      className="colorLabel"
                    >
                      {mappingEntry.value}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          }
        </div>
      )}
      <Map
        center={[0, 0]}
        bounds={bounds}
        zoom={2}
        scrollWheelZoom={false}
        key={width}
        style={{
          width,
          height,
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
