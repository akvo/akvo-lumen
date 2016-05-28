import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import DatasetHeader from '../components/dataset/DatasetHeader';
import DatasetTable from '../components/dataset/DatasetTable';
import { showModal } from '../actions/activeModal';
import { fetchDataset, transform } from '../actions/dataset';

require('../styles/Dataset.scss');

class Dataset extends Component {

  constructor() {
    super();
    this.handleShowDatasetSettings = this.handleShowDatasetSettings.bind(this);
  }

  componentDidMount() {
    const { dispatch, dataset } = this.props;
    dispatch(fetchDataset(dataset.id));
  }

  handleShowDatasetSettings() {
    this.props.dispatch(showModal('dataset-settings', {
      id: this.props.dataset.id,
    }));
  }

  render() {
    const { dataset, dispatch } = this.props;
    return (
      <div className="Dataset">
        <DatasetHeader
          onShowDatasetSettings={this.handleShowDatasetSettings}
          name={dataset.name}
          id={dataset.id}
        />
        {dataset.rows != null ?
          <DatasetTable
            columns={dataset.columns}
            rows={dataset.rows}
            onTransform={(transformation) => dispatch(transform(dataset.id, transformation))}
          />
          :
          <div>loading...</div>}
      </div>
    );
  }
}

Dataset.propTypes = {
  dataset: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    columns: PropTypes.array,
    rows: PropTypes.array,
  }),
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state, ownProps) {
  const datasetId = ownProps.params.datasetId;
  const dataset = state.library.datasets[datasetId];
  return {
    dataset,
  };
}

export default connect(mapStateToProps)(Dataset);
