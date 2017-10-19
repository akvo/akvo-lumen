import React, { Component } from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Map, CircleMarker, Popup, TileLayer } from 'react-leaflet';
import leaflet from 'leaflet';
import { isEqual, cloneDeep } from 'lodash';
import leafletUtfGrid from '../../vendor/leaflet.utfgrid';
import * as chart from '../../utilities/chart';
import Spinner from '../common/LoadingSpinner';

require('../../../node_modules/leaflet/dist/leaflet.css');
require('./MapVisualisation.scss');

const L = leafletUtfGrid(leaflet);

// We need to use leaflet private methods which have underscore dangle
/* eslint no-underscore-dangle: "off" */

const getColumnTitle = (dataset, columnName) =>
  dataset.get('columns')
  .find(item => item.get('columnName') === columnName)
  .get('title');

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

const Legend = ({ pointColorMapping, position = 'bottom', title = '' }) => (
  <div className={`Legend ${position}`}>
    <h4>{title}</h4>
    <div className="listContainer">
      <ul>
        {pointColorMapping.map(item =>
          <li
            key={item.value}
          >
            <div
              className="colorMarker"
              style={{
                backgroundColor: item.color,
              }}
            />
            <p className="label">
              {chart.replaceLabelIfValueEmpty(item.value)}
            </p>
          </li>
          )}
      </ul>
    </div>
  </div>
  );

Legend.propTypes = {
  pointColorMapping: PropTypes.array.isRequired,
  title: PropTypes.string,
  position: PropTypes.string,
};

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

const PopupContent = ({ data, layerDataset, onImageLoad }) => (
  <ul className="PopupContent">
    { Object.keys(data).sort().map(key =>
      <li
        key={key}
      >
        <h4>{getColumnTitle(layerDataset, key)}</h4>
        <span>
          {isImage(data[key]) ?
            <a
              href={data[key]}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="imageContainer">
                <img
                  src={data[key]}
                  role="presentation"
                  onLoad={onImageLoad}
                />
              </div>
            </a>
                :
            <span>
              {data[key]}
            </span>
          }
        </span>
      </li>
      )}
  </ul>
);

PopupContent.propTypes = {
  data: PropTypes.object.isRequired,
  layerDataset: PropTypes.object.isRequired,
  onImageLoad: PropTypes.func.isRequired,
};

export default class MapVisualisation extends Component {

  constructor() {
    super();
    this.renderLeafletMap = this.renderLeafletMap.bind(this);
  }
  componentDidMount() {
    this.renderLeafletMap(this.props);
  }
  componentWillReceiveProps(nextProps) {
    this.renderLeafletMap(nextProps);
  }
  renderLeafletMap(nextProps) {
    const { visualisation, datasets } = nextProps;
    const { tileUrl, tileAttribution } = getBaseLayerAttributes(visualisation.spec.baseLayer);
    const layer = visualisation.spec.layers[0];
    const layerDataset = layer ? datasets[layer.datasetId] : null;

    // Windshaft map
    const tenantDB = visualisation.tenantDB;
    const baseURL = `/maps/${tenantDB}/layergroup`;
    const layerGroupId = visualisation.layerGroupId;
    const xCenter = [0, 0];
    const xZoom = 2;

    const node = this.leafletMapNode;

    let map;

    if (!this.storedSpec) {
      // Store a copy of the layer spec to compare to future changes so we know when to re-render
      this.storedSpec = cloneDeep(this.props.visualisation.spec.layers[0]);
    }

    if (!this.storedBaseLayer) {
      // Do the same thing for the baselayer
      this.storedBaseLayer = cloneDeep(this.props.visualisation.spec.baseLayer);
    }

    if (!this.map) {
      map = L.map(node).setView(xCenter, xZoom);
      this.map = map;
    } else {
      map = this.map;
    }

    // Display or update the baselayer tiles
    if (!this.baseLayer) {
      this.baseLayer = L.tileLayer(tileUrl, { attribution: tileAttribution });
      this.baseLayer.addTo(map);
    } else {
      const oldTileUrl = getBaseLayerAttributes(this.storedBaseLayer).tileUrl;
      const newTileUrl = tileUrl;

      if (oldTileUrl !== newTileUrl) {
        this.storedBaseLayer = cloneDeep(nextProps.visualisation.spec.baseLayer);

        map.removeLayer(this.baseLayer);
        this.baseLayer = L.tileLayer(tileUrl, { attribution: tileAttribution });
        this.baseLayer.addTo(map).bringToBack();
      }
    }

    // Update the bounding box if necessary
    if (visualisation.metadata && visualisation.metadata.boundingBox) {
      const boundingBoxChanged =
        !isEqual(this.storedBoundingBox, visualisation.metadata.boundingBox);
      if (!this.storedBoundingBox || boundingBoxChanged) {
        this.storedBoundingBox = visualisation.metadata.boundingBox.slice(0);
        map.fitBounds(visualisation.metadata.boundingBox);
      }
    }

    const newSpec = nextProps.visualisation.spec.layers[0] || {};
    const oldSpec = this.storedSpec || {};
    const filtersChanged = !isEqual(newSpec.filters, oldSpec.filters);

    // Add or update the windshaft tile layer if necessary
    if (tenantDB && layerGroupId) {
      if (!this.dataLayer) {
        this.dataLayer = L.tileLayer(`${baseURL}/${layerGroupId}/{z}/{x}/{y}.png`);
        this.dataLayer.addTo(map);
      } else {
        const needToUpdate = Boolean(
          newSpec.datasetId !== oldSpec.datasetId ||
          filtersChanged ||
          newSpec.geom !== newSpec.geom ||
          newSpec.pointColorColumn !== oldSpec.pointColorColumn ||
          !isEqual(newSpec.pointColorMapping, oldSpec.pointColorMapping) ||
          newSpec.pointSize !== oldSpec.pointSize ||
          newSpec.visible !== oldSpec.visible
        );
        if (needToUpdate) {
          this.storedSpec = cloneDeep(this.props.visualisation.spec.layers[0]);

          map.removeLayer(this.dataLayer);
          this.dataLayer = L.tileLayer(`${baseURL}/${layerGroupId}/{z}/{x}/{y}.png`);
          this.dataLayer.addTo(map);
        }
      }
    }

    const popup = newSpec.popup;
    const havePopupData = popup && popup.length > 0;
    const haveUtfGrid = Boolean(this.utfGrid);
    const needToRemovePopup = this.utfGrid && !havePopupData;
    const popupChanged = (!this.popup || !isEqual(popup, this.popup));
    const needToAddOrUpdate =
      havePopupData && (popupChanged || filtersChanged);
    const windshaftAvailable = tenantDB && layerGroupId;
    const canUpdate = windshaftAvailable || needToRemovePopup;

    if ((needToAddOrUpdate || needToRemovePopup) && canUpdate) {
      if (haveUtfGrid) {
        // Remove the existing grid
        this.map.closePopup();
        map.removeLayer(this.utfGrid);
        this.utfGrid = null;
      }

      if (havePopupData) {
        this.popup = cloneDeep(popup);
        // eslint-disable-next-line new-cap
        this.utfGrid = new L.utfGrid(`${baseURL}/${layerGroupId}/0/{z}/{x}/{y}.grid.json?callback={cb}`, {
          resolution: 4,
        });

        this.utfGrid.on('click', (e) => {
          if (e.data) {
            this.popupElement = L.popup()
            .setLatLng(e.latlng)
            .openOn(map);

            // Adjust size of popup and map position to make popup contents visible
            const adjustLayoutForPopup = () => {
              this.popupElement.update();
              if (this.popupElement._map && this.popupElement._map._panAnim) {
                this.popupElement._map._panAnim = undefined;
              }
              this.popupElement._adjustPan();
            };

            // Although we use leaflet to create the popup, we can still render the contents
            // with react-dom
            render(
              <PopupContent
                data={e.data}
                layerDataset={layerDataset}
                onImageLoad={adjustLayoutForPopup}
              />,
              this.popupElement._contentNode,
              adjustLayoutForPopup
            );
          }
        });
        map.addLayer(this.utfGrid);
      }
    }
  }

  render() {
    const { visualisation, datasets, width, height } = this.props;
    /*
    const displayLayers = getDataLayers(visualisation.spec.layers, datasets);
    const bounds = calculateBounds(displayLayers);
    const title = visualisation.name || '';
    const titleLength = title.toString().length;
    const titleHeight = titleLength > 48 ? 56 : 36;
    const mapHeight = height - titleHeight;
    */
    const { tileUrl, tileAttribution } = getBaseLayerAttributes(visualisation.spec.baseLayer);

    return (
      <div
        className="MapVisualisation dashChart"
        style={{
          width,
          height,
        }}
      >
        {/*
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
      */}
        <div className="mapContainer">
          <div
            className="leafletMap"
            ref={(ref) => { this.leafletMapNode = ref; }}
          />
          {visualisation.metadata && visualisation.metadata.pointColorMapping &&
            <Legend
              position={visualisation.spec.layers[0].legend.position}
              title={visualisation.spec.layers[0].legend.title}
              pointColorMapping={visualisation.metadata.pointColorMapping}
            />
          }
          {
            visualisation.awaitingResponse &&
            <Spinner />
          }
          {
            visualisation.failedToLoad &&
            <div className="failedIndicator" />
          }
        </div>
      </div>
    );
  }
}

MapVisualisation.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};
