import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ensureLibraryLoaded } from '../actions/library';
import MergeTransformation from '../components/transformation/MergeTransformation';

const transformationComponent = {
  merge: MergeTransformation,
};

class Transformation extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
    };
    this.props.dispatch(ensureLibraryLoaded())
      .then(() => this.setState({ loading: false }));
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
          onApplyTransformation={() => null}
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
