import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { connect, useSelector } from 'react-redux';
import { withRouter } from 'react-router';
import { showModal } from '../actions/activeModal';
import {
  fetchDataset,
  fetchDatasetGroups,
  updateDatasetMeta,
  pollTxImportStatus,
  startTx,
  undoTx,
  endTx,
} from '../actions/dataset';
import { showNotification } from '../actions/notification';
import { getId, getTitle } from '../domain/entity';
import {
  getTransformations,
  getRows,
  getColumns,
  getIsLockedFromTransformations,
} from '../domain/dataset';
import * as api from '../utilities/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { TRANSFORM_DATASET } from '../constants/analytics';
import { trackEvent, trackPageView } from '../utilities/analytics';
import NavigationPrompt from '../components/common/NavigationPrompt';
import DatasetHeader from '../components/dataset/DatasetHeader';
import DatasetTableV2 from '../components/dataset/DatasetTableV2';
import DatasetTableV1 from '../components/dataset/DatasetTable';
import usePendingSaving from '../components/common/PendingSaving';

require('../components/dataset/Dataset.scss');

function Dataset(props) {
  const env = useSelector(
    state => state.env.environment
  );

  const isFeatureFlag = env.rqg;

  const dataset = useSelector(
    state => state.library.datasets[props.params.datasetId]
  );

  const [title, setTitle] = useState(dataset ? getTitle(dataset) : '');

  // Pending transformations are represented as
  // an oredered map from timestamp to transformation
  const [pendingTransformations, setPendingTransformations] = useState(
    Immutable.OrderedMap()
  );

  const [hasTrackedPageView, setHasTrackedPageView] = useState(false);

  const [currentGroup, changeCurrentGroup] = useState(null);

  const removePending = timestamp =>
    setPendingTransformations(x => x.delete(timestamp));

  const onTransform = (transformation) => {
    const { dispatch } = props;
    const id = dataset.get('id');
    const now = Date.now();
    const transformationJs = transformation.toJS();

    trackEvent(TRANSFORM_DATASET, transformationJs.op);

    setPendingTransformations(x => x.set(now, transformation));

    dispatch(startTx(id));

    return api
      .post(
        `/api/transformations/${id}/transform/${transformationJs.op}`,
        transformationJs
      )
      .then((response) => {
        if (!response.ok) {
          removePending(now);
          throw new Error(response.body.message);
        } else {
          dispatch(
            pollTxImportStatus(response.body.jobExecutionId, () => {
              dispatch(endTx(id));
            }, isFeatureFlag)
          );
        }
      })
      .then(() => removePending(now))
      .catch((error) => {
        dispatch(showNotification('error', error.message));
        dispatch(endTx(id, false));
        throw error;
      });
  };

  const onUndoTransformation = () => {
    const { dispatch } = props;
    const id = dataset.get('id');
    const now = Date.now();

    setPendingTransformations(x => x.set(now, Immutable.Map({ op: 'undo' })));

    dispatch(undoTx(id));

    api
      .post(`/api/transformations/${id}/undo`)
      .then((response) => {
        if (!response.ok) {
          removePending(now);
          throw new Error(response.body.message);
        } else {
          dispatch(
            pollTxImportStatus(response.body.jobExecutionId, () => {
              dispatch(endTx(id));
            }, isFeatureFlag)
          );
        }
      })
      .then(() => removePending(now))
      .catch(() => {
        dispatch(showNotification('error', 'Failed to undo.'));
      });
  };

  const handleSave = (onError) => {
    const { dispatch, params } = props;
    dispatch(updateDatasetMeta(params.datasetId, { name: title }, onError));
  };

  // eslint-disable-next-line new-cap
  const pendingSaving = usePendingSaving(handleSave);

  const onShowDatasetSettings = () => {
    props.dispatch(
      showModal('dataset-settings', {
        id: getId(dataset),
      })
    );
  };

  const onNavigateToVisualise = () => {
    props.history.push({
      pathname: '/visualisation//create',
      state: {
        preselectedDatasetId: props.params.datasetId,
        from: 'dataset',
      },
    });
  };

  const onChangeQuestionGroup = (groupId) => {
    const { datasetId } = props.params;

    return new Promise((resolve) => {
      if (currentGroup && currentGroup.get('groupId') === groupId) {
        resolve();
      } else {
        changeCurrentGroup(null);

        api.get(`/api/datasets/${datasetId}/group/${groupId}`).then((response) => {
          if (!response.ok) {
            throw new Error(response.body.message);
          }

          changeCurrentGroup(Immutable.fromJS(response.body));
          resolve();
        })
      .catch((error) => {
        dispatch(showNotification('error getting group'));
        throw error;
      });
      }
    });
  };

  useEffect(() => {
    // previous componentDidMount code
    // runs only once thus if has an empty array dependency list
    const { params, dispatch } = props;
    const { datasetId } = params;

    if (isFeatureFlag && (dataset == null || dataset.get('groups') == null)) {
      dispatch(
        fetchDatasetGroups(datasetId, null, () => setHasTrackedPageView(true))
      );
    } else if (dataset == null || dataset.get('rows') == null) {
      dispatch(
        fetchDataset(datasetId, null, () => setHasTrackedPageView(true))
      );
    } else if (dataset && !hasTrackedPageView) {
      setHasTrackedPageView(true);
    }
  }, []);

  useEffect(() => {
    if (isFeatureFlag) {
      const { datasetId } = props.params;

      if (dataset && dataset.get('groups')) {
        const groups = dataset.get('groups');

        // if there's no question group
        if (groups.get('main')) {
          api.get(`/api/datasets/${datasetId}/group/main`).then((response) => {
            if (!response.ok) {
              throw new Error(response.body.message);
            }

            changeCurrentGroup(Immutable.fromJS(response.body));
          })
          .catch((error) => {
            dispatch(showNotification('error getting group'));
            throw error;
          });
        } else if (groups.get('metadata')) {
          api.get(`/api/datasets/${datasetId}/group/metadata`).then((response) => {
            if (!response.ok) {
              throw new Error(response.body.message);
            }

            changeCurrentGroup(Immutable.fromJS(response.body));
          })
          .catch((error) => {
            dispatch(showNotification('error getting group'));
            throw error;
          });
        }
      }
    }
  }, [dataset]);

  useEffect(() => {
    if (hasTrackedPageView && dataset) {
      // eslint-disable-next-line no-console
      console.log('tracking', `Dataset: ${getTitle(dataset)}`);
      trackPageView(`Dataset: ${getTitle(dataset)}`);
    }
  }, [hasTrackedPageView]);

  useEffect(() => {
    if (dataset && title !== getTitle(dataset)) {
      pendingSaving.onHandleSave();
    }
  }, [title]);


  const { params, history } = props;
  const { datasetId } = params;
  if (dataset == null) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationPrompt
      shouldPrompt={pendingSaving.savingFailed}
      history={history}
    >
      <div className="Dataset">
        {isFeatureFlag ? (<DatasetTableV2
          history={history}
          datasetId={datasetId}
          group={currentGroup}
          columns={currentGroup ? currentGroup.get('columns') : null}
          rows={currentGroup ? currentGroup.get('rows') : null}
          groups={dataset.get('groups')}
          Header={DatasetHeader}
          headerProps={{
            onShowDatasetSettings,
            name: getTitle(dataset),
            id: getId(dataset),
            isUnsavedChanges: pendingSaving.isUnsavedChanges,
            onBeginEditTitle: pendingSaving.onBeginEdit,
            savingFailed: pendingSaving.savingFailed,
            timeToNextSave: pendingSaving.timeToNextSave,
            onChangeTitle: setTitle,
            onSaveDataset: pendingSaving.onHandleSave,
          }}
          transformations={getTransformations(dataset)}
          isLockedFromTransformations={getIsLockedFromTransformations(dataset)}
          pendingTransformations={pendingTransformations.valueSeq()}
          onTransform={onTransform}
          onUndoTransformation={onUndoTransformation}
          onNavigateToVisualise={onNavigateToVisualise}
          datasetGroupsAvailable={dataset.get('groups') != null}
          groupAvailable={!!currentGroup}
          handleChangeQuestionGroup={onChangeQuestionGroup}
        />) : (
          <DatasetTableV1
            history={history}
            datasetId={datasetId}
            columns={getColumns(dataset)}
            rows={getRows(dataset)}
            Header={DatasetHeader}
            headerProps={{
              onShowDatasetSettings,
              name: getTitle(dataset),
              id: getId(dataset),
              isUnsavedChanges: pendingSaving.isUnsavedChanges,
              onBeginEditTitle: pendingSaving.onBeginEdit,
              savingFailed: pendingSaving.savingFailed,
              timeToNextSave: pendingSaving.timeToNextSave,
              onChangeTitle: setTitle,
              onSaveDataset: pendingSaving.onHandleSave,
            }}
            transformations={getTransformations(dataset)}
            isLockedFromTransformations={getIsLockedFromTransformations(
            dataset
          )}
            pendingTransformations={pendingTransformations.valueSeq()}
            onTransform={onTransform}
            onUndoTransformation={onUndoTransformation}
            onNavigateToVisualise={onNavigateToVisualise}
            datasetRowAvailable={getRows(dataset) != null}
          />
        ) }
      </div>
    </NavigationPrompt>
  );
}

Dataset.propTypes = {
  dataset: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  params: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
};

// // Just inject `dispatch`
export default withRouter(connect()(Dataset));
