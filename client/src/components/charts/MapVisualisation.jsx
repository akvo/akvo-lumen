import React, { Component } from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
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
  renderLeafletLayer(layer, id, layerGroupId, datasets, baseURL, map) {
    if (!this[`storedSpec${id}`]) {
      // Store a copy of the layer spec to compare to future changes so we know when to re-render
      this[`storedSpec${id}`] = cloneDeep(layer);
    }

    const newSpec = layer || {};
    const oldSpec = this[`storedSpec${id}`] || {};
    const filtersChanged = !isEqual(newSpec.filters, oldSpec.filters);
    const popup = newSpec.popup;
    const havePopupData = popup && popup.length > 0;
    const haveUtfGrid = Boolean(this[`utfGrid${id}`]);
    const needToRemovePopup = this[`utfGrid${id}`] && !havePopupData;
    const popupChanged = (!this[`popup${id}`] || !isEqual(popup, this[`popup${id}`]));
    const needToAddOrUpdate =
      havePopupData && (popupChanged || filtersChanged);
    const windshaftAvailable = Boolean(layerGroupId);
    const canUpdate = windshaftAvailable || needToRemovePopup;

    if ((needToAddOrUpdate || needToRemovePopup) && canUpdate) {
      if (haveUtfGrid) {
        // Remove the existing grid
        this.map.closePopup();
        map.removeLayer(this[`utfgrid${id}`]);
        this[`utfgrid${id}`] = null;
      }

      if (!havePopupData) {
        return;
      }

      this[`popup${id}`] = cloneDeep(popup);
      this[`utfGrid${id}`] =
        // eslint-disable-next-line new-cap
        new L.utfGrid(`${baseURL}/${layerGroupId}/${id}/{z}/{x}/{y}.grid.json?callback={cb}`, {
          resolution: 4,
        });

      this[`utfGrid${id}`].on('click', (e) => {
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
              layerDataset={datasets[layer.datasetId]}
              onImageLoad={adjustLayoutForPopup}
            />,
            this.popupElement._contentNode,
            adjustLayoutForPopup
          );
        }
      });
      map.addLayer(this[`utfGrid${id}`]);
    }
  }
  renderLeafletMap(nextProps) {
    const { visualisation, datasets, width, height } = nextProps;
    const { tileUrl, tileAttribution } = getBaseLayerAttributes(visualisation.spec.baseLayer);

    // Windshaft map
    // const tenantDB = visualisation.tenantDB;
    const baseURL = '/maps/layergroup';
    const layerGroupId = visualisation.layerGroupId;
    const xCenter = [0, 0];
    const xZoom = 2;

    const node = this.leafletMapNode;

    let map;

    /* General map stuff - not layer specific */
    if (!this.storedBaseLayer) {
      // Do the same thing for the baselayer
      this.storedBaseLayer = cloneDeep(this.props.visualisation.spec.baseLayer);
    }

    if (!this.map) {
      map = L.map(node).setView(xCenter, xZoom);
      map.scrollWheelZoom.disable();
      this.map = map;
    } else {
      map = this.map;
    }

    const haveDimensions = Boolean(this.oldHeight && this.oldWidth);
    const dimensionsChanged = Boolean(height !== this.oldHeight || width !== this.oldWidth);

    if (!haveDimensions || dimensionsChanged) {
      this.map.invalidateSize();
      this.oldHeight = height;
      this.oldWidth = width;
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
        // map.fitBounds(visualisation.metadata.boundingBox, { maxZoom: 12 });
      }
    }

    if (!this.storedSpec) {
      // Store a copy of the layer spec to compare to future changes so we know when to re-render
      this.storedSpec = cloneDeep(visualisation.spec);
    }

    const newSpec = nextProps.visualisation.spec || {};
    const oldSpec = this.storedSpec || {};

    // Add or update the windshaft tile layer if necessary
    if (layerGroupId) {
      if (!this.dataLayer) {
        this.dataLayer = L.tileLayer(`${baseURL}/${layerGroupId}/all/{z}/{x}/{y}.png`);
        this.dataLayer.addTo(map);
      } else {
        const needToUpdate = Boolean(
          !isEqual(newSpec.layers, oldSpec.layers)
        );
        if (needToUpdate) {
          this.storedSpec = cloneDeep(this.props.visualisation.spec);

          map.removeLayer(this.dataLayer);
          this.dataLayer = L.tileLayer(`${baseURL}/${layerGroupId}/all/{z}/{x}/{y}.png`);
          this.dataLayer.addTo(map);
        }
      }
    }

    visualisation.spec.layers.forEach((layer, idx) => {
      this.renderLeafletLayer(layer, idx, layerGroupId, datasets, baseURL, map);
    });
  }

  render() {
    const { visualisation, width, height } = this.props;
    const title = visualisation.name || '';
    const titleLength = title.toString().length;
    const titleHeight = titleLength > 48 ? 56 : 36;
    const mapWidth = width || '100%';
    const mapHeight = height ? height - titleHeight : `calc(100% - ${titleHeight}px)`;

    return (
      <div
        className="MapVisualisation dashChart"
        style={{
          width,
          height,
        }}
      >
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
        <div
          className="mapContainer"
          style={{
            height: mapHeight,
            width: mapWidth,
          }}
        >
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
