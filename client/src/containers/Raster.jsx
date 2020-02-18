import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import L from 'leaflet';
import warning from 'warning';
import { showModal } from '../actions/activeModal';
import { fetchRaster } from '../actions/raster';
import { getId, getTitle } from '../domain/entity';
import { trackPageView } from '../utilities/analytics';
import EntityTypeHeader from '../components/entity-editor/EntityTypeHeader';
import * as api from '../utilities/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

require('../../node_modules/leaflet/dist/leaflet.css');
require('../components/charts/MapVisualisation.scss');

class Raster extends Component {

  constructor() {
    super();
    this.state = { layerGroupId: null };
    this.renderLeafletMap = this.renderLeafletMap.bind(this);
    // this.state = {
    //   asyncComponents: null
    // };
    // this.handleShowDatasetSettings = this.handleShowDatasetSettings.bind(this);
    // this.transform = this.transform.bind(this);
    // this.undo = this.undo.bind(this);
  }

  componentDidMount() {
    const { params, raster, dispatch } = this.props;
    const { rasterId } = params;

    this.handleTrackPageView(this.props);

    if (raster == null) {
      dispatch(fetchRaster(rasterId));
    }

    api.post('/api/visualisations/rasters', { rasterId })
      .then(({ body }) => {
        const layergroup = body;
        this.setState({ layerGroupId: layergroup.layerGroupId,
          layerMetadata: layergroup.layerMetadata });
        this.renderLeafletMap();
      })
      .catch((error) => {
        warning(false, 'Failed to fetch layergroup: %s', error.message);
      });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.handleTrackPageView(nextProps);
  }

  handleTrackPageView(props) {
    const { raster } = props;
    if (raster && !this.state.hasTrackedPageView) {
      this.setState({ hasTrackedPageView: true }, () => {
        trackPageView(`Raster: ${getTitle(raster)}`);
      });
    }
  }

  handleShowRasterSettings() {
    this.props.dispatch(showModal('dataset-settings', {
      id: getId(this.state.raster),
    }));
  }

  renderLeafletMap() {
    const { layerGroupId, layerMetadata } = this.state;

    const baseURL = '/maps/layergroup';
    const xCenter = [0, 0];
    const xZoom = 2;

    const node = this.leafletMapNode;

    let map;

    if (!this.map) {
      map = L.map(node).setView(xCenter, xZoom);
      map.scrollWheelZoom.disable();
      map.setMaxZoom(12);
      if (layerMetadata.boundingBox) {
        map.fitBounds(layerMetadata.boundingBox);
      }
      this.map = map;
    } else {
      map = this.map;
    }

    if (!this.baseLayer) {
      this.baseLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution:
          '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' });
      this.baseLayer.addTo(map);
    }


    if (layerGroupId) {
      if (!this.dataLayer) {
        this.dataLayer = L.tileLayer(`${baseURL}/${layerGroupId}/{z}/{x}/{y}.png`);
        this.dataLayer.addTo(map);
      }
    }
  }

  render() {
    const { layerGroupId } = this.state;

    if (layerGroupId == null) {
      return <LoadingSpinner />;
    }

    const { raster } = this.props;
    const title = getTitle(raster) || '';

    return (
      <div
        className="Raster"
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
        }}
      >
        <EntityTypeHeader
          title={title}
        />
        <div
          className="leafletMap"
          ref={(ref) => { this.leafletMapNode = ref; }}
          style={{
            flex: 1,
            marginTop: '4rem',
          }}
        />
      </div>
    );
  }
}

Raster.propTypes = {
  raster: PropTypes.object,
  params: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

// Just inject `dispatch`
export default connect((state, props) => ({
  raster: state.library.rasters[props.params.rasterId],
}))(Raster);
