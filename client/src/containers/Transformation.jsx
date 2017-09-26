import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as api from '../api';
import { ensureLibraryLoaded } from '../actions/library';
import { fetchDataset } from '../actions/dataset';
import MergeTransformation from '../components/transformation/MergeTransformation';

const transformationComponent = {
  merge: MergeTransformation,
};

class Transformation extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      transforming: false,
    };
    this.props.dispatch(ensureLibraryLoaded())
      .then(() => this.setState({ loading: false }));
  }

  handleApplyTransformation(transformation) {
    const { dispatch, datasetId } = this.props;
    this.setState({ transforming: true });
    api.post(`/api/transformations/${datasetId}/transform`, transformation)
      .then(response => response.json())
      .then(() => dispatch(fetchDataset(datasetId)))
      .then(() => null);
  }

  render() {
    if (this.state.loading) return null;

    const { datasetId, datasets } = this.props;
    const TransformationComponent = transformationComponent.merge;
    return (
      <div className="Transformation">
        <TransformationComponent
          datasetId={datasetId}
          datasets={datasets}
          onApplyTransformation={transformation => this.handleApplyTransformation(transformation)}
        />
      </div>
    );
  }
}

Transformation.propTypes = {
  datasets: PropTypes.object,
  datasetId: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state, props) {
  return {
    datasets: state.library.datasets,
    datasetId: props.params.datasetId,
  };
}

export default connect(mapStateToProps)(Transformation);
