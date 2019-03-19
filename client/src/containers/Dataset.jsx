import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { showModal } from '../actions/activeModal';
import { fetchDataset, updateDatasetMeta, pollTxImportStatus, startTx, endTx } from '../actions/dataset';
import { showNotification } from '../actions/notification';
import { getId, getTitle } from '../domain/entity';
import { getTransformations, getRows, getColumns, getIsLockedFromTransformations } from '../domain/dataset';
import * as api from '../utilities/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { SAVE_COUNTDOWN_INTERVAL, SAVE_INITIAL_TIMEOUT } from '../constants/time';
import { TRANSFORM_DATASET } from '../constants/analytics';
import { trackEvent, trackPageView } from '../utilities/analytics';
import NavigationPrompt from '../components/common/NavigationPrompt';

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
      timeToNextSave: SAVE_INITIAL_TIMEOUT,
      timeFromPreviousSave: 0,
    };
    this.handleShowDatasetSettings = this.handleShowDatasetSettings.bind(this);
    this.handleNavigateToVisualise = this.handleNavigateToVisualise.bind(this);
    this.handleChangeDatasetTitle = this.handleChangeDatasetTitle.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleSaveFailure = this.handleSaveFailure.bind(this);
    this.transform = this.transform.bind(this);
    this.undo = this.undo.bind(this);
  }

  componentDidMount() {
    const { params, dataset, dispatch } = this.props;
    const { datasetId } = params;

    this.isMountedFlag = true;

    this.handleTrackPageView(this.props);

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

  componentWillReceiveProps(nextProps) {
    this.handleTrackPageView(nextProps);
  }

  componentWillUnmount() {
    this.isMountedFlag = false;
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
    const transformationJs = transformation.toJS();

    trackEvent(TRANSFORM_DATASET, transformationJs.op);
    this.setPendingTransformation(now, transformation);
    dispatch(startTx(id));
    return api.post(`/api/transformations/${id}/transform`, transformationJs)
      .then((response) => {
        if (!response.ok) {
          this.removePending(now);
          throw new Error(response.body.message);
        } else {
          dispatch(pollTxImportStatus(response.body.jobExecutionId, () => {
            dispatch(endTx(id));
          }));
        }
      })
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
    dispatch(startTx(id));
    api.post(`/api/transformations/${id}/undo`)
      .then((response) => {
        if (!response.ok) {
          this.removePending(now);
          throw new Error(response.body.message);
        } else {
          dispatch(pollTxImportStatus(response.body.jobExecutionId, () => {
            dispatch(endTx(id));
          }));
        }
      })
      .then(() => this.removePending(now))
      .catch(() => {
        this.props.dispatch(showNotification('error', 'Failed to undo.'));
      });
  }

  handleTrackPageView(props) {
    const { dataset } = props;
    if (dataset && !this.state.hasTrackedPageView) {
      this.setState({ hasTrackedPageView: true }, () => {
        trackPageView(`Dataset: ${getTitle(dataset)}`);
      });
    }
  }

  handleChangeDatasetTitle(name) {
    this.setState({ title: name }, () => {
      this.handleSave();
    });
  }

  handleSaveFailure() {
    this.setState({
      timeToNextSave: this.state.timeToNextSave * 2,
      timeFromPreviousSave: 0,
      savingFailed: true,
    }, () => {
      this.saveInterval = setInterval(() => {
        const { timeFromPreviousSave, timeToNextSave } = this.state;
        if (timeToNextSave - timeFromPreviousSave > SAVE_COUNTDOWN_INTERVAL) {
          this.setState({ timeFromPreviousSave: timeFromPreviousSave + SAVE_COUNTDOWN_INTERVAL });
          return;
        }
        clearInterval(this.saveInterval);
      }, SAVE_COUNTDOWN_INTERVAL);
      setTimeout(() => {
        this.handleSave();
      }, this.state.timeToNextSave);
    });
  }

  handleSave() {
    const { dispatch, params } = this.props;
    dispatch(updateDatasetMeta(params.datasetId, { name: this.state.title }, (error) => {
      if (!this.isMountedFlag) return;
      if (error) {
        this.handleSaveFailure();
        return;
      }
      this.setState({
        isUnsavedChanges: false,
        timeToNextSave: SAVE_INITIAL_TIMEOUT,
        timeFromPreviousSave: 0,
        savingFailed: false,
      });
    }));
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
        state: {
          preselectedDatasetId: this.props.params.datasetId,
          from: 'dataset',
        },
      })
    );
  }

  render() {
    const { pendingTransformations } = this.state;
    const { dataset, params } = this.props;
    const { datasetId } = params;
    if (dataset == null || !this.state.asyncComponents) {
      return <LoadingSpinner />;
    }
    const { DatasetHeader, DatasetTable } = this.state.asyncComponents;
    return (
      <NavigationPrompt shouldPrompt={this.state.savingFailed}>
        <div className="Dataset">
          <DatasetHeader
            onShowDatasetSettings={this.handleShowDatasetSettings}
            name={getTitle(dataset)}
            id={getId(dataset)}
            isUnsavedChanges={this.state.isUnsavedChanges}
            onChangeTitle={this.handleChangeDatasetTitle}
            onBeginEditTitle={() => this.setState({ isUnsavedChanges: true })}
            savingFailed={this.state.savingFailed}
            timeToNextSave={this.state.timeToNextSave - this.state.timeFromPreviousSave}
            onSaveDataset={this.handleSave}
          />
          {getRows(dataset) != null ? (
            <DatasetTable
              datasetId={datasetId}
              columns={getColumns(dataset)}
              rows={getRows(dataset)}
              transformations={getTransformations(dataset)}
              isLockedFromTransformations={getIsLockedFromTransformations(dataset)}
              pendingTransformations={pendingTransformations.valueSeq()}
              onTransform={transformation => this.transform(transformation)}
              onUndoTransformation={() => this.undo()}
              onNavigateToVisualise={this.handleNavigateToVisualise}
            />
          ) : (
            <LoadingSpinner />
          )}
        </div>
      </NavigationPrompt>
    );
  }
}

Dataset.propTypes = {
  dataset: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  params: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

// Just inject `dispatch`
export default connect((state, props) => ({
  dataset: state.library.datasets[props.params.datasetId],
}))(Dataset);
