import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { connect, useSelector } from 'react-redux';
import { withRouter } from 'react-router';
import { showModal } from '../actions/activeModal';
import { fetchDataset, updateDatasetMeta, pollTxImportStatus, startTx, undoTx, endTx } from '../actions/dataset';
import { showNotification } from '../actions/notification';
import { getId, getTitle } from '../domain/entity';
import { getTransformations, getRows, getColumns, getIsLockedFromTransformations } from '../domain/dataset';
import * as api from '../utilities/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { SAVE_COUNTDOWN_INTERVAL, SAVE_INITIAL_TIMEOUT } from '../constants/time';
import { TRANSFORM_DATASET } from '../constants/analytics';
import { trackEvent, trackPageView } from '../utilities/analytics';
import NavigationPrompt from '../components/common/NavigationPrompt';
import DatasetHeader from '../components/dataset/DatasetHeader';
import DatasetTable from '../components/dataset/DatasetTable';

require('../components/dataset/Dataset.scss');

function Dataset(props) {
  const isMountedFlag = useRef(false);

  const dataset = useSelector(state => state.library.datasets[props.params.datasetId]);

  const [title, setTitle] = useState(dataset ? getTitle(dataset) : '');

  const [isUnsavedChanges, setIsUnsavedChanges] = useState(false);

  // Pending transformations are represented as
  // an oredered map from timestamp to transformation
  const [pendingTransformations, setPendingTransformations] = useState(Immutable.OrderedMap());

  const [timeToNextSave, setTimeToNextSave] = useState(SAVE_INITIAL_TIMEOUT);

  const [timeFromPreviousSave, setTimeFromPreviousSave] = useState(0);

  const [hasTrackedPageView, setHasTrackedPageView] = useState(false);

  const [savingFailed, setSavingFailed] = useState(false);

  const handleTrackPageView = () => {
    if (dataset && !hasTrackedPageView) {
      setHasTrackedPageView(true);
    }
  };

  const setPendingTransformation = (timestamp, transformation) => {
    setPendingTransformations(x => x.set(timestamp, transformation));
  };

  const setPendingUndo = timestamp =>
        setPendingTransformations(x => x.set(timestamp, Immutable.Map({ op: 'undo' })));

  const removePending = timestamp => setPendingTransformations(x => x.delete(timestamp));

  const transform = (transformation) => {
    const { dispatch } = props;
    const id = dataset.get('id');
    const now = Date.now();
    const transformationJs = transformation.toJS();

    trackEvent(TRANSFORM_DATASET, transformationJs.op);

    setPendingTransformation(now, transformation);

    dispatch(startTx(id));

    return api.post(`/api/transformations/${id}/transform/${transformationJs.op}`, transformationJs)
      .then((response) => {
        if (!response.ok) {
          removePending(now);
          throw new Error(response.body.message);
        } else {
          dispatch(pollTxImportStatus(response.body.jobExecutionId, () => {
            dispatch(endTx(id));
          }));
        }
      })
      .then(() => removePending(now))
      .catch((error) => {
        dispatch(showNotification('error', error.message));
        dispatch(endTx(id, false));
        throw error;
      });
  };

  const undo = () => {
    const { dispatch } = props;
    const id = dataset.get('id');
    const now = Date.now();

    setPendingUndo(now);

    dispatch(undoTx(id));

    api.post(`/api/transformations/${id}/undo`)
      .then((response) => {
        if (!response.ok) {
          removePending(now);
          throw new Error(response.body.message);
        } else {
          dispatch(pollTxImportStatus(response.body.jobExecutionId, () => {
            dispatch(endTx(id));
          }));
        }
      })
      .then(() => removePending(now))
      .catch(() => {
        dispatch(showNotification('error', 'Failed to undo.'));
      });
  };

  const handleSaveFailure = () => {
    setTimeToNextSave(x => x * 2);
    setTimeFromPreviousSave(0);
    setSavingFailed(true);
  };

  const handleSave = () => {
    const { dispatch, params } = props;
    dispatch(updateDatasetMeta(params.datasetId, { name: title }, (error) => {
      if (!isMountedFlag.current) return;
      if (error) {
        handleSaveFailure();
        return;
      }
      setIsUnsavedChanges(false);
      setTimeToNextSave(SAVE_INITIAL_TIMEOUT);
      setTimeToNextSave(0);
      setSavingFailed(false);
    }));
  };

  const handleShowDatasetSettings = () => {
    props.dispatch(showModal('dataset-settings', {
      id: getId(dataset),
    }));
  };

  const handleNavigateToVisualise = () => {
    props.history.push({
      pathname: '/visualisation//create',
      state: {
        preselectedDatasetId: props.params.datasetId,
        from: 'dataset',
      },
    });
  };

  useEffect(() => {
    // previous componentDidMount code
    // runs only once thus if has an empty array dependency list
    const { params, dispatch } = props;
    const { datasetId } = params;
    isMountedFlag.current = true;
    if (dataset == null || dataset.get('rows') == null) {
      dispatch(fetchDataset(datasetId, null, () => setHasTrackedPageView(true)));
    } else {
      handleTrackPageView(props);
    }
    return () => {
      // code from componentWillUnMount
      isMountedFlag.current = false;
    };
  }, []);

  useEffect(() => {
    if (hasTrackedPageView && dataset) {
      // eslint-disable-next-line no-console
      console.log('tracking', `Dataset: ${getTitle(dataset)}`);
      trackPageView(`Dataset: ${getTitle(dataset)}`);
    }
  }, [hasTrackedPageView]);

  useEffect(() => {
    if (dataset && title !== getTitle(dataset)) {
      handleSave();
    }
  }, [title]);

  useEffect(() => {
    if (savingFailed) {
      const saveInterval = setInterval(() => {
        if (timeToNextSave - timeFromPreviousSave > SAVE_COUNTDOWN_INTERVAL) {
          setTimeFromPreviousSave(x => x + SAVE_COUNTDOWN_INTERVAL);
          return;
        }
        clearInterval(saveInterval);
      }, SAVE_COUNTDOWN_INTERVAL);
      setTimeout(() => {
        handleSave();
      }, timeToNextSave);
    }
  }, [savingFailed]);

  const { params, history } = props;
  const { datasetId } = params;
  if (dataset == null) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationPrompt
      shouldPrompt={savingFailed}
      history={history}
    >
      <div className="Dataset">
        <DatasetTable
          history={history}
          datasetId={datasetId}
          columns={getColumns(dataset)}
          rows={getRows(dataset)}
          Header={DatasetHeader}
          headerProps={{
            onShowDatasetSettings: handleShowDatasetSettings,
            name: getTitle(dataset),
            id: getId(dataset),
            isUnsavedChanges,
            onChangeTitle: setTitle,
            onBeginEditTitle: () => setIsUnsavedChanges(true),
            savingFailed,
            timeToNextSave: timeToNextSave - timeFromPreviousSave,
            onSaveDataset: handleSave,
          }}
          transformations={getTransformations(dataset)}
          isLockedFromTransformations={getIsLockedFromTransformations(
            dataset
          )}
          pendingTransformations={pendingTransformations.valueSeq()}
          onTransform={transformation => transform(transformation)}
          onUndoTransformation={undo}
          onNavigateToVisualise={handleNavigateToVisualise}
          datasetRowAvailable={getRows(dataset) != null}
        />
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
