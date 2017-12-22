import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import L from 'leaflet';
import warning from 'warning';
import { showModal } from '../actions/activeModal';
import { fetchRaster } from '../actions/raster';
import { getId, getTitle } from '../domain/entity';
import * as api from '../api';


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

    if (raster == null) {
      dispatch(fetchRaster(rasterId));
    }

    api.post('/api/visualisations/rasters', { rasterId })
      .then(response => response.json())
      .then((layergroup) => {
        this.setState({ layerGroupId: layergroup.layerGroupId });
        this.renderLeafletMap();
      })
      .catch((error) => {
        warning(false, 'Failed to fetch layergroup: %s', error.message);
      });
  }

  handleShowRasterSettings() {
    this.props.dispatch(showModal('dataset-settings', {
      id: getId(this.state.raster),
    }));
  }

  renderLeafletMap() {
    const { layerGroupId } = this.state;

    const baseURL = '/maps/layergroup';
    const xCenter = [0, 0];
    const xZoom = 2;

    const node = this.leafletMapNode;

    let map;

    if (!this.map) {
      map = L.map(node).setView(xCenter, xZoom);
      map.scrollWheelZoom.disable();
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
      return <div className="Dataset loadingIndicator">Loading...</div>;
    }

    const { raster } = this.props;
    const title = getTitle(raster) || '';
    const titleLength = title.toString().length;
    const titleHeight = titleLength > 48 ? 56 : 36;
    const mapWidth = '100%';
    const mapHeight = `calc(100% - ${titleHeight}px)`;

    return (
      <div
        className="leafletMap"
        ref={(ref) => { this.leafletMapNode = ref; }}
        style={{
          height: mapHeight,
          width: mapWidth,
        }}
      />
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
