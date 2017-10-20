import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import * as api from '../api';
import { ensureLibraryLoaded } from '../actions/library';
import { fetchDataset } from '../actions/dataset';
import { showNotification } from '../actions/notification';
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
  }

  componentWillMount() {
    this.props.dispatch(ensureLibraryLoaded())
      .then(() => this.setState({ loading: false }));
  }

  handleApplyTransformation(transformation) {
    const { dispatch, datasetId, router } = this.props;
    this.setState({ transforming: true });
    dispatch(showNotification('info', 'Merging...'));
    api.post(`/api/transformations/${datasetId}/transform`, transformation)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to merge dataset');
      })
      .then(() => dispatch(fetchDataset(datasetId)))
      .then(() => {
        this.setState({ transforming: false });
        dispatch(showNotification('info', 'Successfully merged datasets', true));
        router.push(`/dataset/${datasetId}`);
      })
      .catch((err) => {
        this.setState({ transforming: false });
        dispatch(showNotification('error', `Failed to merge: ${err.message}`));
      });
  }

  render() {
    const { loading, transforming } = this.state;
    if (loading) return null;

    const { datasetId, datasets } = this.props;
    const TransformationComponent = transformationComponent.merge;
    return (
      <div className="Transformation">
        <TransformationComponent
          transforming={transforming}
          datasetId={datasetId}
          datasets={datasets}
          onApplyTransformation={transformation => this.handleApplyTransformation(transformation)}
        />
      </div>
    );
  }
}

Transformation.propTypes = {
  router: PropTypes.object.isRequired,
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

export default connect(mapStateToProps)(withRouter(Transformation));
