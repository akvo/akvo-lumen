import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { showModal } from '../actions/activeModal';
import { fetchDataset, updateDatasetMeta } from '../actions/dataset';
import { showNotification } from '../actions/notification';
import { getId, getTitle } from '../domain/entity';
import { getTransformations, getRows, getColumns } from '../domain/dataset';
import * as api from '../api';

require('../components/dataset/Dataset.scss');

class Dataset extends Component {

  constructor() {
    super();
    this.state = {
      asyncComponents: null,
      isUnsavedChanges: false,
      // Pending transformations are represented as
      // an oredered map from timestamp to transformation
      pendingTransformations: Immutable.OrderedMap(),
    };
    this.handleShowDatasetSettings = this.handleShowDatasetSettings.bind(this);
    this.handleNavigateToVisualise = this.handleNavigateToVisualise.bind(this);
    this.handleChangeDatasetTitle = this.handleChangeDatasetTitle.bind(this);
    this.transform = this.transform.bind(this);
    this.undo = this.undo.bind(this);
  }

  componentDidMount() {
    const { params, dataset, dispatch } = this.props;
    const { datasetId } = params;

    if (dataset == null || dataset.get('rows') == null) {
      dispatch(fetchDataset(datasetId));
    }

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
  setPendingTransformation(timestamp, transformation) {
    const { pendingTransformations } = this.state;
    this.setState({
      pendingTransformations: pendingTransformations.set(timestamp, transformation),
    });
  }

  setPendingUndo(timestamp) {
    const { pendingTransformations } = this.state;
    this.setState({
      pendingTransformations: pendingTransformations.set(timestamp, Immutable.Map({ op: 'undo' })),
    });
  }

  removePending(timestamp) {
    const { pendingTransformations } = this.state;
    this.setState({ pendingTransformations: pendingTransformations.delete(timestamp) });
  }

  transform(transformation) {
    const { dataset, dispatch } = this.props;
    const id = dataset.get('id');
    const now = Date.now();

    this.setPendingTransformation(now, transformation);
    return api.post(`/api/transformations/${id}/transform`, transformation.toJS())
      .then((response) => {
        if (!response.ok) {
          return response.json().then(({ message }) => {
            throw new Error(message);
          });
        }
        return response.json();
      })
      .then(() => dispatch(fetchDataset(id)))
      .then(() => this.removePending(now))
      .catch((error) => {
        dispatch(showNotification('error', error.message));
        throw error;
      });
  }

  undo() {
    const { dataset, dispatch } = this.props;
    const id = dataset.get('id');
    const now = Date.now();

    this.setPendingUndo(now);
    api.post(`/api/transformations/${id}/undo`)
      .then(response => response.json())
      .then(() => dispatch(fetchDataset(id)))
      .then(() => this.removePending(now));
  }

  handleChangeDatasetTitle(name) {
    console.log(this.props.dataset.toJS(), name, this);
    const { dispatch, params } = this.props;
    dispatch(updateDatasetMeta(params.datasetId, { name }));
    // this.handleChangeVisualisation({ name: title });
  }

  handleShowDatasetSettings() {
    this.props.dispatch(showModal('dataset-settings', {
      id: getId(this.state.dataset),
    }));
  }

  handleNavigateToVisualise() {
    this.props.dispatch(
      push({
        pathname: '/visualisation/create',
        state: { preselectedDatasetId: this.props.params.datasetId },
      })
    );
  }

  render() {
    const { pendingTransformations } = this.state;
    const { dataset } = this.props;
    if (dataset == null || !this.state.asyncComponents) {
      return <div className="Dataset loadingIndicator">Loading...</div>;
    }
    const { DatasetHeader, DatasetTable } = this.state.asyncComponents;

    return (
      <div className="Dataset">
        <DatasetHeader
          onShowDatasetSettings={this.handleShowDatasetSettings}
          name={getTitle(dataset)}
          id={getId(dataset)}
          isUnsavedChanges={this.state.isUnsavedChanges}
          onChangeTitle={this.handleChangeDatasetTitle}
          onBeginEditTitle={() => this.setState({ isUnsavedChanges: true })}
        />
        {getRows(dataset) != null &&
          <DatasetTable
            columns={getColumns(dataset)}
            rows={getRows(dataset)}
            transformations={getTransformations(dataset)}
            pendingTransformations={pendingTransformations.valueSeq()}
            onTransform={transformation => this.transform(transformation)}
            onUndoTransformation={() => this.undo()}
            onNavigateToVisualise={this.handleNavigateToVisualise}
          />}
      </div>
    );
  }
}

Dataset.propTypes = {
  dataset: PropTypes.object,
  params: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

// Just inject `dispatch`
export default connect((state, props) => ({
  dataset: state.library.datasets[props.params.datasetId],
}))(Dataset);
