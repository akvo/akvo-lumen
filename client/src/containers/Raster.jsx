import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { showModal } from '../actions/activeModal';
import { fetchRaster } from '../actions/raster';
import { getId, getTitle } from '../domain/entity';
// import * as api from '../api';

require('../components/dataset/Dataset.scss');

class Raster extends Component {

  constructor() {
    super();
    this.state = {};
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
  }

  handleShowRasterSettings() {
    this.props.dispatch(showModal('dataset-settings', {
      id: getId(this.state.raster),
    }));
  }

  render() {
    const { raster } = this.props;

    if (raster == null) {
      return <div className="Dataset loadingIndicator">Loading...</div>;
    }

    // const { DatasetHeader, DatasetTable } = this.state.asyncComponents;

    return (
      <div className="Dataset">
        <span>{ getTitle(raster) } raster will be shown here</span>
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
