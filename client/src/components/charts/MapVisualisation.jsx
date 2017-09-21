import React from 'react';
import PropTypes from 'prop-types';
import { Map, CircleMarker, Popup, TileLayer } from 'react-leaflet';
import * as chart from '../../utilities/chart';

require('../../../node_modules/leaflet/dist/leaflet.css');
require('./MapVisualisation.scss');

const isImage = (value) => {
  // For now, treat every link as an image, until we have something like an "image-url" type
  if (typeof value === 'string' && value.match(/^https/) !== null) {
    return true;
  }
  return false;
};

const calculateBounds = (layerArray) => {
  if (layerArray.length === 0) {
    return null;
  }

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

  /*
   * If there's a single geo point (or if all the geo points happens to overlap) the min/max
   * coordinates will be the same. Expand them so that we get a sensible bounding box.
   */
  if (minLat === maxLat) {
    minLat -= 1;
    maxLat += 1;
  }
  if (minLong === maxLong) {
    minLong -= 1;
    maxLong += 1;
  }

  return [[minLat, minLong], [maxLat, maxLong]];
};

const getDataLayers = (layers, datasets) => {
  const displayLayers = [];

  layers.forEach((layer) => {
    if (layer.visible && layer.datasetId && layer.latitude !== null && layer.longitude !== null) {
      const chartData = chart.getMapData(layer, datasets);

      if (chartData) {
        const chartValues = chartData.values;
        const sortFunc =
          chart.getPointColorMappingSortFunc(chartData.metadata.pointColorColumnType);
        const pointColorMapping =
          Object.keys(chartData.metadata.pointColorMapping).map(value => ({
            value,
            color: chartData.metadata.pointColorMapping[value],
          }))
          .sort(sortFunc);

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
  const title = visualisation.name || '';
  const titleLength = title.toString().length;
  const titleHeight = titleLength > 48 ? 56 : 36;
  const mapHeight = height - titleHeight;
  const { tileUrl, tileAttribution } = getBaseLayerAttributes(visualisation.spec.baseLayer);

  // Windshaft map
  const dbHost = visualisation.dbHost;
  const baseURL = `/maps/${dbHost}/layergroup`;
  const layerGroupId = visualisation.layergroupid;
  const xCenter = [0, 0];
  const xWidth = 800;
  const xHeight = 600;
  const xZoom = 2;

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
      <hr />
      <Map
        center={xCenter}
        zoom={xZoom}
        scrollWheelZoom={false}
        key={layerGroupId}
        style={{ width: xWidth, height: xHeight }}
      >
        <TileLayer
          attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
          url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
        />
        {(layerGroupId != null) && (dbHost != null) &&
          <TileLayer
            url={`${baseURL}/${layerGroupId}/{z}/{x}/{y}.png`}
          />
        }
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
