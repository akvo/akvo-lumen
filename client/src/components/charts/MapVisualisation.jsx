import React, { Component } from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import leaflet from 'leaflet';
import { isEqual, cloneDeep, get, compact } from 'lodash';
import { FormattedMessage } from 'react-intl';

import leafletUtfGrid from '../../vendor/leaflet.utfgrid';
import * as chart from '../../utilities/chart';
import Spinner from '../common/LoadingSpinner';
import { trackEvent } from '../../utilities/analytics';
import { RENDER_MAP_LAYER_TYPE } from '../../constants/analytics';
import RenderComplete from './RenderComplete';

require('../../../node_modules/leaflet/dist/leaflet.css');
require('./MapVisualisation.scss');

const L = leafletUtfGrid(leaflet);
const META_SCALE = 0.5;

// We need to use leaflet private methods which have underscore dangle
/* eslint no-underscore-dangle: "off" */

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

// returns true if we need to set "word-break: break-all" on el to avoid x-overflow
const wrapLabel = (str) => {
  if (!str) {
    return false;
  }
  return Boolean(str.toString().split(' ').some(word => word.length > 18));
};

const LegendEntry = ({ singleMetadata, layer }) => (
  <div className="LegendEntry">
    {Boolean(get(singleMetadata, 'pointColorMapping')) &&
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
    {Boolean(get(singleMetadata, 'shapeColorMapping')) &&
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
    {Boolean(singleMetadata && layer.layerType === 'raster') &&
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

const Legend = ({ layers, layerMetadata }) => {
  const legendLayers = compact(layers.map((layer, idx) => {
    const metadata = layerMetadata[idx];
    const showLayer =
      Boolean(
        layer.legend.visible &&
        metadata &&
        (metadata.pointColorMapping || metadata.shapeColorMapping)
      ) ||
      layer.layerType === 'raster';
    return showLayer ? { metadata, layer } : null;
  }));
  return legendLayers.length ? (
    <div className="Legend">
      <div className="container">
        {
          legendLayers.map(({ metadata, layer }, idx) => {
            const haveLayer = Boolean(layer);
            if (!haveLayer) {
              return null;
            }
            return (
              <LegendEntry
                key={idx}
                layer={layer}
                singleMetadata={metadata}
              />
            );
          })
        }
      </div>
    </div>
  ) : null;
};

Legend.propTypes = {
  layers: PropTypes.array,
  layerMetadata: PropTypes.array,
};

const getColumnTitle = (titles, key) => titles.find(obj => obj.columnName === key).title;

const PopupContent = ({ data, singleMetadata, onImageLoad }) => {
  const getTitle = (key) => {
    const isMeta = key.substring(0, 1) === '_'; // We set meta columns to start with _ on backend

    if (isMeta) {
      return singleMetadata.shapeColorMappingTitle;
    }
    return getColumnTitle(singleMetadata.columnTitles, key);
  };

  return (
    <ul className="PopupContent">
      { Object.keys(data).sort().map(key =>
        <li
          key={key}
        >
          <h4>{getTitle(key)}</h4>
          <span>
            {isImage(data[key]) ?
              <div >
                <div className="imageContainer">
                  <img
                    className="noPointerEvents"
                    src={data[key]}
                    role="presentation"
                    onLoad={onImageLoad}
                  />
                  <div className="suppressImageContextMenu" />
                </div>
              </div>
                  :
              <span>
                {data[key] === null ? 'No data' : data[key]}
              </span>
            }
          </span>
        </li>
        )}
    </ul>
  );
};

PopupContent.propTypes = {
  data: PropTypes.object.isRequired,
  onImageLoad: PropTypes.func.isRequired,
  singleMetadata: PropTypes.object,
};

export default class MapVisualisation extends Component {

  constructor() {
    super();
    this.renderLeafletLayer = this.renderLeafletLayer.bind(this);
    this.renderLeafletMap = this.renderLeafletMap.bind(this);
    this.state = {
      hasTrackedLayerTypes: false,
      hasRendered: false,
    };
    this.hasAddedLayers = false;
  }

  componentDidMount() {
    this.renderLeafletMap(this.props);
  }

  // eslint-disable-next-line no-unused-vars
  componentDidUpdate(prevProps, prevState) {
    this.renderLeafletMap(prevProps);
  }

  componentWillUnmount() {
    clearInterval(this.loadInterval);
  }

  addLayer(layer, map) {
    if (!this.hasAddedLayers) {
      this.loadInterval = setInterval(() => {
        const checks = Object.values(map._layers).map((l) => {
          try {
            return l.isLoading();
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log(l, error);
            return false;
          }
        });
        // console.log('layers', map._layers);
        // console.log('checks', checks);
        const check = checks.filter(o => o).length === 0;
//        console.log('check', check);
        if (check) {
          this.setState({ hasRendered: true });
          clearInterval(this.loadInterval);
        }
      }, 1000);
    }
    this.hasAddedLayers = true;
    return layer.addTo(map);
  }

  renderLeafletLayer(layer, id, layerGroupId, layerMetadata, baseURL, map) {
    if (!this[`storedSpec${id}`]) {
      // Store a copy of the layer spec to compare to future changes so we know when to re-render
      this[`storedSpec${id}`] = cloneDeep(layer);
    }

    const newSpec = layer || {};
    const oldSpec = this[`storedSpec${id}`] || {};
    const filtersChanged = !isEqual(newSpec.filters, oldSpec.filters);
    const popup = newSpec.popup;
    const haveAggregation = layer.aggregationGeomColumn;
    const havePopupData = Boolean(popup && popup.length > 0) || haveAggregation;
    const haveUtfGrid = Boolean(this[`utfGrid${id}`]);
    const needToRemovePopup = this[`utfGrid${id}`] && !havePopupData;
    const aggregationChanged = Boolean(
        newSpec.aggregationDataset !== oldSpec.aggregationDataset ||
        newSpec.aggregationColumn !== oldSpec.aggregationColumn ||
        newSpec.aggregationGeomColumn !== oldSpec.aggregationGeomColumn ||
        newSpec.aggregationMethod !== oldSpec.aggregationMethod
    );
    const popupChanged = Boolean(!this[`popup${id}`] || !isEqual(popup, this[`popup${id}`])) || aggregationChanged;
    const needToAddOrUpdate =
      havePopupData && (popupChanged || filtersChanged);
    const windshaftAvailable = Boolean(layerGroupId);
    const canUpdate = windshaftAvailable || needToRemovePopup;

    if ((needToAddOrUpdate || needToRemovePopup) && canUpdate) {
      if (haveUtfGrid) {
        // Remove the existing grid
        this.map.closePopup();
        map.removeLayer(this[`utfGrid${id}`]);
        this[`utfGrid${id}`] = null;
        this[`popup${id}`] = null;
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
              singleMetadata={layerMetadata[id]}
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
    const { visualisation, metadata, width, height, exporting } = nextProps;
    const { tileUrl, tileAttribution } = getBaseLayerAttributes(visualisation.spec.baseLayer);

    // Windshaft map
    // const tenantDB = visualisation.tenantDB;
    const baseURL = '/maps/layergroup';
    const layerGroupId = metadata.layerGroupId;
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
      map = L.map(node, { zoomControl: !exporting }).setView(xCenter, xZoom);
      map.scrollWheelZoom.disable();
      this.map = map;
    } else {
      map = this.map;
    }

    const haveDimensions = Boolean(this.oldHeight && this.oldWidth);
    const dimensionsChanged = Boolean(height !== this.oldHeight || width !== this.oldWidth);

    if (!haveDimensions || dimensionsChanged) {
      setTimeout(() => {
        map.invalidateSize(false);
      }, 300);
      this.oldHeight = height;
      this.oldWidth = width;
    }

    // Display or update the baselayer tiles
    if (!this.baseLayer) {
      this.baseLayer = L.tileLayer(tileUrl, { attribution: tileAttribution });
      this.addLayer(this.baseLayer, map);
    } else {
      const oldTileUrl = getBaseLayerAttributes(this.storedBaseLayer).tileUrl;
      const newTileUrl = tileUrl;

      if (oldTileUrl !== newTileUrl) {
        this.storedBaseLayer = cloneDeep(nextProps.visualisation.spec.baseLayer);

        map.removeLayer(this.baseLayer);
        this.baseLayer = L.tileLayer(tileUrl, { attribution: tileAttribution });
        this.addLayer(this.baseLayer, map).bringToBack();
      }
    }

    if (metadata && metadata.layerMetadata && metadata.layerMetadata.length) {
      const mergedBoundingBox = [[90, 180], [-90, -180]];

      metadata.layerMetadata.forEach((layer) => {
        if (layer.boundingBox) {
          if (layer.boundingBox[0][0] < mergedBoundingBox[0][0]) {
            mergedBoundingBox[0][0] = layer.boundingBox[0][0];
          }
          if (layer.boundingBox[0][1] < mergedBoundingBox[0][1]) {
            mergedBoundingBox[0][1] = layer.boundingBox[0][1];
          }
          if (layer.boundingBox[1][0] > mergedBoundingBox[1][0]) {
            mergedBoundingBox[1][0] = layer.boundingBox[1][0];
          }
          if (layer.boundingBox[1][1] > mergedBoundingBox[1][1]) {
            mergedBoundingBox[1][1] = layer.boundingBox[1][1];
          }
        }
      });

      if (!isEqual(mergedBoundingBox, this.storedBoundingBox)) {
        this.storedBoundingBox = mergedBoundingBox;
        map.fitBounds(mergedBoundingBox, { maxZoom: 12, minZoom: 1 });
      }
    }

    const newSpec = nextProps.visualisation.spec || {};

    if (get(newSpec, 'layers.length') && !this.state.hasTrackedLayerTypes) {
      this.setState({
        hasTrackedLayerTypes: true,
      }, () => {
        newSpec.layers.forEach(({ layerType }) => {
          trackEvent(RENDER_MAP_LAYER_TYPE, layerType || 'raster');
        });
      });
    }

    // Add or update the windshaft tile layer if necessary
    if (get(newSpec, 'layers.length') === 0 && this.dataLayer) {
      map.removeLayer(this.dataLayer);
      this.dataLayer = null;
    } else if (layerGroupId) {
      if (!this.dataLayer) {
        this.dataLayer = L.tileLayer(`${baseURL}/${layerGroupId}/all/{z}/{x}/{y}.png`);
        this.addLayer(this.dataLayer, map);
      } else {
        const needToUpdate = Boolean(
          layerGroupId !== this.storedLayerGroupId
        );
        if (needToUpdate) {
          map.removeLayer(this.dataLayer);
          this.dataLayer = L.tileLayer(`${baseURL}/${layerGroupId}/all/{z}/{x}/{y}.png`);
          this.addLayer(this.dataLayer, map);
        }
      }
    }

    if (layerGroupId !== this.storedLayerGroupId) {
      visualisation.spec.layers.forEach((layer, idx) => {
        this.renderLeafletLayer(
          layer, idx, layerGroupId, metadata.layerMetadata, baseURL, map
        );
      });
    }
    this.storedLayerGroupId = layerGroupId;
  }

  render() {
    const { visualisation, metadata, width, height, showTitle, datasets, exporting } = this.props;
    const title = visualisation.name || '';
    const titleLength = title.toString().length;
    const titleHeight = titleLength > 48 ? 56 : 36;
    const mapWidth = width || '100%';
    let mapHeight;
    if (showTitle) {
      mapHeight = height ?
        height - (titleHeight * (1 + META_SCALE)) :
        `calc(100% - ${(titleHeight * (1 + META_SCALE))}px)`;
    } else {
      mapHeight = height || '100%';
    }
    const needLegend = Boolean(
      visualisation.spec.layers &&
      visualisation.spec.layers.filter(l => l.legend.visible).length &&
      metadata &&
      metadata.layerMetadata &&
      metadata.layerMetadata.length
    );
    const lastUpdated = chart.getDataLastUpdated({ visualisation, datasets });
    return (
      <div
        className="MapVisualisation dashChart"
        style={{
          width,
          height,
        }}
      >
        {this.state.hasRendered && visualisation.id && <RenderComplete id={visualisation.id} />}
        {showTitle && (
          <div>
            <h2
              style={{
                height: titleHeight,
                lineHeight: titleLength > 96 ? '16px' : '20px',
                fontSize: titleLength > 96 ? '14px' : '16px',
              }}
            >
              <span>
                {chart.getTitle(visualisation)}
              </span>
            </h2>
            {lastUpdated && (
              <p
                className="chartMeta"
                style={{
                  height: titleHeight * META_SCALE,
                  lineHeight: titleLength > 96 ? '12px' : '16px',
                  fontSize: titleLength > 96 ? '10px' : '12px',
                }}
              >
                <span className="capitalize">
                  <FormattedMessage id="data_last_updated" />
                </span>: {lastUpdated}
              </p>
            )}
          </div>
        )}
        <div
          className="mapContainer"
          style={{
            height: mapHeight,
            width: mapWidth,
          }}
        >
          <div
            style={{
              height: `${height}px`,
              width: `${width}px`,
            }}
            className="leafletMap" id="leafletMap"
            ref={(ref) => { this.leafletMapNode = ref; }}
          />
          {needLegend &&
            <Legend
              layers={visualisation.spec.layers}
              layerMetadata={metadata.layerMetadata}
            />
          }
          {visualisation.awaitingResponse && !exporting && (
            <Spinner />
          )}
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
  metadata: PropTypes.object,
  width: PropTypes.number,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  showTitle: PropTypes.bool,
  exporting: PropTypes.bool,
};

MapVisualisation.defaultProps = {
  showTitle: true,
};
