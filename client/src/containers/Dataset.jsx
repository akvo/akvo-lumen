import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { showModal } from '../actions/activeModal';
import { getId, getTitle } from '../domain/entity';
import { getTransformations, getRows, getColumns } from '../domain/dataset';
import {
  fetchDataset,
  transform,
  sendTransformationLog,
  undoTransformation } from '../actions/dataset';

require('../styles/Dataset.scss');

class Dataset extends Component {

  constructor() {
    super();
    this.state = {
      asyncComponents: null,
    };
    this.handleShowDatasetSettings = this.handleShowDatasetSettings.bind(this);
    this.willLeaveDatasets = this.willLeaveDatasets.bind(this);
  }

  componentDidMount() {
    const { dispatch, router, route, params } = this.props;
    const { datasetId } = params;
    router.setRouteLeaveHook(route, this.willLeaveDatasets);
    dispatch(fetchDataset(datasetId));

    require.ensure([], () => {
      /* eslint-disable global-require */
      const DatasetHeader = require('../components/dataset/DatasetHeader').default;
      const DatasetTable = require('../components/dataset/DatasetTable').default;
      /* eslint-enable global-require */

      this.setState({
        asyncComponents: {
          DatasetHeader,
          DatasetTable,
        },
      });
    }, 'Dataset');
  }

  willLeaveDatasets() {
    const { dispatch, dataset } = this.props;
    if (dataset.get('history') != null && dataset.get('history').size > 0) {
      dispatch(sendTransformationLog(getId(dataset), dataset.get('transformations')));
    }
  }

  handleShowDatasetSettings() {
    this.props.dispatch(showModal('dataset-settings', {
      id: getId(this.props.dataset),
    }));
  }

  render() {
    const { dataset, dispatch } = this.props;
    if (dataset == null || !this.state.asyncComponents) {
      return <div className="Dataset">Loading...</div>;
    }
    const { DatasetHeader, DatasetTable } = this.state.asyncComponents;

    return (
      <div className="Dataset">
        <DatasetHeader
          onShowDatasetSettings={this.handleShowDatasetSettings}
          name={getTitle(dataset)}
          id={getId(dataset)}
        />
        {getRows(dataset) != null &&
          <DatasetTable
            columns={getColumns(dataset)}
            rows={getRows(dataset)}
            transformations={getTransformations(dataset)}
            onTransform={(transformation) => dispatch(transform(getId(dataset), transformation))}
            onUndoTransformation={() => dispatch(undoTransformation(getId(dataset)))}
          />}
      </div>
    );
  }
}

Dataset.propTypes = {
  dataset: PropTypes.object,
  router: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state, ownProps) {
  const datasetId = ownProps.params.datasetId;
  const dataset = state.library.datasets[datasetId];
  return {
    dataset,
  };
}

export default connect(mapStateToProps)(withRouter(Dataset));
