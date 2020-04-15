import React, { useState, useRef, useEffect, createRef } from 'react';
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

const initMap = (node, xCenter, xZoom, zoomControl) => {
  const m = L.map(node, { zoomControl }).setView(xCenter, xZoom);
  m.scrollWheelZoom.disable();
  return m;
};

PopupContent.propTypes = {
  data: PropTypes.object.isRequired,
  onImageLoad: PropTypes.func.isRequired,
  singleMetadata: PropTypes.object,
};

const MapVisualisation = (props) => {
  const [hasRendered, setHasRendered] = useState(false);
  const leafletMapNode = useRef(null);

  const storedBaseLayer = useRef(null);
  const baseLayer = useRef(null);

  const dataLayer = useRef(null);

  const [layerGroupId, setLayerGroupId] = useState(null);

  const mapp = useRef(null);

  const storedSpecs = useRef(null);
  const utfGrids = useRef(null);
  const popups = useRef(null);

  const popupElement = useRef(null);
  const baseURL = '/maps/layergroup';

  const renderLeafletLayer = (layer, id, metadata, map) => {
    const { layerMetadata } = metadata;
    if (!storedSpecs.current[id].current) {
      // Store a copy of the layer spec to compare to future changes so we know when to re-render
      storedSpecs.current[id].current = cloneDeep(layer);
    }

    const newSpec = layer || {};
    const oldSpec = storedSpecs.current[id].current || {};
    const filtersChanged = !isEqual(newSpec.filters, oldSpec.filters);
    const popup = newSpec.popup;
    const haveAggregation = layer.aggregationGeomColumn;
    const havePopupData = Boolean(popup && popup.length > 0) || haveAggregation;
    const haveUtfGrid = Boolean(utfGrids.current[id].current);
    const needToRemovePopup = utfGrids.current[id].current && !havePopupData;
    const aggregationChanged = Boolean(
        newSpec.aggregationDataset !== oldSpec.aggregationDataset ||
        newSpec.aggregationColumn !== oldSpec.aggregationColumn ||
        newSpec.aggregationGeomColumn !== oldSpec.aggregationGeomColumn ||
        newSpec.aggregationMethod !== oldSpec.aggregationMethod
    );
    const popupChanged = Boolean(!popups.current[id].current ||
      !isEqual(popup, popups.current[id].current)) || aggregationChanged;
    const needToAddOrUpdate = havePopupData && (popupChanged || filtersChanged);

    const canUpdate = Boolean(metadata.layerGroupId) || needToRemovePopup;

    if ((needToAddOrUpdate || needToRemovePopup) && canUpdate) {
      if (haveUtfGrid) {
        // Remove the existing grid
        map.closePopup();
        map.removeLayer(utfGrids.current[id].current);
        utfGrids.current[id].current = null;
        popups.current[id].current = null;
      }

      if (!havePopupData) {
        return;
      }

      popups.current[id].current = cloneDeep(popup);
      utfGrids.current[id].current =
        // eslint-disable-next-line new-cap
        new L.utfGrid(`${baseURL}/${metadata.layerGroupId}/${id}/{z}/{x}/{y}.grid.json?callback={cb}`, {
          resolution: 4,
        });

      utfGrids.current[id].current.on('click', (e) => {
        if (e.data) {
          popupElement.current = L.popup()
          .setLatLng(e.latlng)
          .openOn(map);

          // Adjust size of popup and map position to make popup contents visible
          const adjustLayoutForPopup = () => {
            popupElement.current.update();
            if (popupElement.current._map && popupElement.current._map._panAnim) {
              popupElement.current._map._panAnim = undefined;
            }
            popupElement.current._adjustPan();
          };

          // Although we use leaflet to create the popup, we can still render the contents
          // with react-dom
          render(
            <PopupContent
              data={e.data}
              singleMetadata={layerMetadata[id]}
              onImageLoad={adjustLayoutForPopup}
            />,
            popupElement.current._contentNode,
            adjustLayoutForPopup
          );
        }
      });
      map.addLayer(utfGrids.current[id].current);
    }
  };

  const renderLeafletMap = (nodeEl) => {
    if (!mapp.current) {
      mapp.current = initMap(nodeEl, [0, 0], 2, !props.exporting);
    }

    const visualisation = props.visualisation;

    /* General map stuff - not layer specific */
    if (!storedBaseLayer.current) {
      // Do the same thing for the baselayer
      storedBaseLayer.current = cloneDeep(visualisation.spec.baseLayer);
    }

    // Display or update the baselayer tiles
    const { tileUrl, tileAttribution } = getBaseLayerAttributes(visualisation.spec.baseLayer);
    if (!baseLayer.current) {
      baseLayer.current = L.tileLayer(tileUrl, { attribution: tileAttribution });
      baseLayer.current.addTo(mapp.current);
    } else {
      const oldTileUrl = getBaseLayerAttributes(storedBaseLayer.current).tileUrl;
      const newTileUrl = tileUrl;

      if (oldTileUrl !== newTileUrl) {
        storedBaseLayer.current = cloneDeep(visualisation.spec.baseLayer);

        mapp.current.removeLayer(baseLayer.current);
        baseLayer.current = L.tileLayer(tileUrl, { attribution: tileAttribution });
        baseLayer.current.addTo(mapp.current).bringToBack();
      }
    }

    const metadata = props.metadata;

    const newSpec = visualisation.spec || {};

    // Add or update the windshaft tile layer if necessary
    if (get(newSpec, 'layers.length') === 0 && dataLayer.current) {
      mapp.current.removeLayer(dataLayer.current);
      dataLayer.current = null;
    } else if (metadata.layerGroupId) {
      if (!dataLayer.current) {
        dataLayer.current = L.tileLayer(`${baseURL}/${metadata.layerGroupId}/all/{z}/{x}/{y}.png`);
        dataLayer.current.addTo(mapp.current);
      } else {
        const needToUpdate = Boolean(
          metadata.layerGroupId !== layerGroupId
        );
        if (needToUpdate) {
          mapp.current.removeLayer(dataLayer.current);
          dataLayer.current = L.tileLayer(`${baseURL}/${metadata.layerGroupId}/all/{z}/{x}/{y}.png`);
          dataLayer.current.addTo(mapp.current);
        }
      }
    }
  };

  // renderleaftlet, run every time leafletMapNode or props changes
  useEffect(() => {
    const specLayers = props.visualisation.spec.layers;
    storedSpecs.current = specLayers.map(() => createRef());
    utfGrids.current = specLayers.map(() => createRef());
    popups.current = specLayers.map(() => createRef());
    renderLeafletMap(leafletMapNode.current);
  }, [leafletMapNode, props, layerGroupId]);

  // metrics, run only on mount
  useEffect(() => {
    const spec = props.visualisation.spec || {};
    if (get(spec, 'layers.length')) {
      spec.layers.forEach(({ layerType }) => {
        trackEvent(RENDER_MAP_LAYER_TYPE, layerType || 'raster');
      });
    }
  }, []);

  // isReadyMap/exporting related, run every time mapp changes
  useEffect(() => {
    setHasRendered(false);
    const loadInterval = setInterval(() => {
      const checks = Object.values(mapp.current._layers).map((l) => {
        try {
          return l.isLoading();
        } catch (error) {
          return false;
        }
      });
      const check = checks.filter(o => o).length === 0;
      if (check) {
        setHasRendered(true);
        clearInterval(loadInterval);
      }
    }, 1000);
    return () => clearInterval(loadInterval);
  }, [mapp]);

  // fired in DashboardEditor, when changing map dimension
  useEffect(() => {
    mapp.current.invalidateSize(false);
  }, [mapp, props.width, props.height]);

  // Fit map bounds, when metadata/layers changes
  const storedBoundingBox = useRef(null);
  useEffect(() => {
    const metadata = props.metadata;
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

      if (!isEqual(mergedBoundingBox, storedBoundingBox.current)) {
        storedBoundingBox.current = mergedBoundingBox;
        mapp.current.fitBounds(mergedBoundingBox, { maxZoom: 12, minZoom: 1 });
      }
    }
  }, [props.metadata, mapp]);

  // Add layers on change props.metadata.layerGroupId
  useEffect(
    () => {
      if (props.metadata.layerGroupId !== layerGroupId) {
        props.visualisation.spec.layers.forEach((layer, idx) => {
          renderLeafletLayer(
            layer, idx, props.metadata, mapp.current
          );
        });
      }
      setLayerGroupId(props.metadata.layerGroupId);
    }, [props.metadata.layerGroupId, layerGroupId]
  );

  const { visualisation, metadata, width, height, showTitle, datasets, exporting } = props;
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
      {hasRendered && visualisation.id && <RenderComplete id={visualisation.id} />}
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
          ref={leafletMapNode}
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
};

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

export default MapVisualisation;
