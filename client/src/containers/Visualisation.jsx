import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { intlShape, injectIntl } from 'react-intl';
import BodyClassName from 'react-body-classname';

import ShareEntity from '../components/modals/ShareEntity';
import LoadingSpinner from '../components/common/LoadingSpinner';
import NavigationPrompt from '../components/common/NavigationPrompt';
import * as actions from '../actions/visualisation';
import * as entity from '../domain/entity';
import { fetchDataset } from '../actions/dataset';
import { trackPageView, trackEvent } from '../utilities/analytics';
import { remapVisualisationDataColumnMappings } from '../utilities/visualisation';
import { fetchLibrary } from '../actions/library';
import mapSpecTemplate from '../constants/Visualisation/mapSpecTemplate';
import pieSpecTemplate from '../constants/Visualisation/pieSpecTemplate';
import lineSpecTemplate from '../constants/Visualisation/lineSpecTemplate';
import pivotTableSpecTemplate from '../constants/Visualisation/pivotTableSpecTemplate';
import scatterSpecTemplate from '../constants/Visualisation/scatterSpecTemplate';
import barSpecTemplate from '../constants/Visualisation/barSpecTemplate';
import bubbleSpecTemplate from '../constants/Visualisation/bubbleSpecTemplate';
import { SAVE_COUNTDOWN_INTERVAL, SAVE_INITIAL_TIMEOUT } from '../constants/time';
import {
  SHARE_VISUALISATION,
  EXPORT_VISUALISATION_PNG,
  EXPORT_VISUALISATION_PDF,
} from '../constants/analytics';

require('../components/visualisation/Visualisation.scss');

const getSpecFromVisualisationType = (visualisationType) => {
  switch (visualisationType) {
    case 'map':
      return { ...mapSpecTemplate };
    case 'pie':
    case 'donut':
    case 'polararea':
      return { ...pieSpecTemplate };
    case 'line':
    case 'area':
      return { ...lineSpecTemplate };
    case 'scatter':
      return { ...scatterSpecTemplate };
    case 'bar':
      return { ...barSpecTemplate };
    case 'pivot table':
      return { ...pivotTableSpecTemplate };
    case 'bubble':
      return { ...bubbleSpecTemplate };
    default:
      return {};
  }
};

class Visualisation extends Component {

  constructor(props) {
    super(props);
    const initialState = {
      isShareModalVisible: false,
      isUnsavedChanges: false,
      isSavePending: false,
      visualisation: {
        type: 'visualisation',
        name: props.intl.formatMessage({ id: 'untitled_visualisation' }),
        visualisationType: null,
        datasetId: null,
        spec: {},
      },
      hasTrackedPageView: false,
      asyncComponents: null,
      timeToNextSave: SAVE_INITIAL_TIMEOUT,
      timeFromPreviousSave: 0,
    };
    const visualisation = props.library.visualisations[props.params.visualisationId];
    if (visualisation) {
      initialState.visualisation = visualisation;
      initialState.isUnsavedChanges = false;
    }
    this.state = initialState;

    this.onSave = this.onSave.bind(this);
    this.onSaveFailure = this.onSaveFailure.bind(this);
    this.handleChangeVisualisationSpec = this.handleChangeVisualisationSpec.bind(this);
    this.handleChangeVisualisation = this.handleChangeVisualisation.bind(this);
    this.handleChangeSourceDataset = this.handleChangeSourceDataset.bind(this);
    this.handleChangeVisualisationTitle = this.handleChangeVisualisationTitle.bind(this);
    this.handleChangeVisualisationType = this.handleChangeVisualisationType.bind(this);
    this.handleVisualisationAction = this.handleVisualisationAction.bind(this);
    this.toggleShareVisualisation = this.toggleShareVisualisation.bind(this);
    this.loadDataset = this.loadDataset.bind(this);
    this.handleFetchShareId = this.handleFetchShareId.bind(this);
  }

  componentDidMount() {
    const { params, library, history, dispatch } = this.props;
    const visualisationId = params.visualisationId;
    const isEditingExistingVisualisation = visualisationId != null;

    // If this is route is accessed via a permalink we'll have to fetch the library,
    // where all the datasets are.
    if (isEmpty(library.datasets)) {
      dispatch(fetchLibrary());
    }

    if (isEditingExistingVisualisation) {
      const visualisation = library.visualisations[visualisationId];
      if (visualisation == null) {
        dispatch(actions.fetchVisualisation(history, visualisationId));
      } else {
        const datasetsRequired = [];
        if (visualisation.visualisationType === 'map') {
          if (visualisation.spec && visualisation.spec.layers) {
            visualisation.spec.layers.forEach((layer) => {
              if (layer.datasetId) {
                datasetsRequired.push(layer.datasetId);
              }
              if (layer.aggregationDataset) {
                datasetsRequired.push(layer.aggregationDataset);
              }
            });
          }
        } else {
          datasetsRequired.push(visualisation.datasetId);
        }
        datasetsRequired.forEach(datasetId => this.loadDataset(datasetId));
        this.handleTrackPageView(visualisation);
      }
    }

    this.isMountedFlag = true;
    this.handleChangeSourceDataset(get(this.props, 'location.state.preselectedDatasetId'));

    require.ensure(['../components/charts/VisualisationViewer'], () => {
      require.ensure([], () => {
        /* eslint-disable global-require */
        const VisualisationHeader =
          require('../components/visualisation/VisualisationHeader').default;
        const VisualisationEditor =
          require('../components/visualisation/VisualisationEditor').default;
        require('../components/visualisation/Visualisation.scss');
        /* eslint-enable global-require */

        this.setState({
          asyncComponents: {
            VisualisationHeader,
            VisualisationEditor,
          },
        });
      }, 'Visualisation');
    }, 'VisualisationViewerPreload');
  }

  componentDidUpdate() {
    if (!this.state.hasTrackedPageView) {
      trackPageView(`Visualisation: ${
        this.state.visualisation.name || this.props.intl.formatMessage({ id: 'untitled_visualisation' })
      }`);
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    /* If there is a visualisation to load from the library, and we haven't loaded it yet, load it
      /* from nextProps if it exists there */
    const { visualisationId } = nextProps.params;
    const isEditingExistingVisualisation = visualisationId != null;
    const loadedVisualisation = prevState.visualisation.id != null;
    const nextPropsHasVisualisation = Boolean(nextProps.library.visualisations[visualisationId]);
    if (
      (isEditingExistingVisualisation && !loadedVisualisation && nextPropsHasVisualisation) ||
        get(prevState.visualisation, 'shareId') !== get(nextProps, `library.visualisations[${visualisationId}].shareId`)
    ) {
      return { visualisation: nextProps.library.visualisations[visualisationId] };
    }
    return null;
  }

  componentWillUnmount() {
    this.isMountedFlag = false;
  }

  onSaveFailure() {
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
        this.onSave();
      }, this.state.timeToNextSave);
    });
  }

  onSave() {
    if (!this.state.visualisation.visualisationType) return;

    const { dispatch, location } = this.props;

    const handleResponse = (error) => {
      if (!this.isMountedFlag) return;
      if (error) {
        this.onSaveFailure();
        return;
      }
      this.setState({
        isUnsavedChanges: false,
        timeToNextSave: SAVE_INITIAL_TIMEOUT,
        timeFromPreviousSave: 0,
        savingFailed: false,
        isSavePending: false,
      });
    };

    if (this.state.visualisation.id) {
      dispatch(actions.saveVisualisationChanges(this.state.visualisation, handleResponse));
    } else if (!this.state.isSavePending) {
      this.setState({ isSavePending: true });
      dispatch(
        actions.createVisualisation(
          this.props.history,
          this.state.visualisation,
          get(location, 'state.collectionId'),
          handleResponse
        )
      );
    }
  }

  handleTrackPageView(visualisation) {
    if (!this.state.hasTrackedPageView) {
      this.setState({ hasTrackedPageView: true }, () => {
        trackPageView(`Visualisation: ${
          visualisation.name || this.props.intl.formatMessage({ id: 'untitled_visualisation' })
        }`);
      });
    }
  }

  handleChangeVisualisation(map, callback = () => {}) {
    this.setState({
      visualisation: { ...this.state.visualisation, ...map },
      isUnsavedChanges: true,
    }, () => {
      this.onSave();
      callback();
    });
  }

  handleChangeVisualisationSpec(value) {
    const spec = update(this.state.visualisation.spec, { $merge: value });
    const visualisation = Object.assign({}, this.state.visualisation, { spec });

    this.handleChangeVisualisation(visualisation);
  }

  loadDataset(datasetId) {
    if (!datasetId) {
      return;
    }
    if (!this.props.library.datasets[datasetId]
      || !this.props.library.datasets[datasetId].get('columns')) {
      this.props.dispatch(fetchDataset(datasetId, true));
    }
  }

  handleChangeSourceDataset(datasetId, optionalSpecChanges = {}) {
    if (!datasetId) return;
    this.handleChangeVisualisation({
      ...this.state.visualisation,
      datasetId,
      spec: {
        ...getSpecFromVisualisationType(this.state.visualisation.visualisationType),
        ...optionalSpecChanges,
      },
    }, () => {
      this.loadDataset(datasetId);
    });
  }

  handleChangeVisualisationType(visualisationType) {
    this.handleChangeVisualisation({
      visualisationType,
      spec: {
        ...getSpecFromVisualisationType(visualisationType),
        ...remapVisualisationDataColumnMappings(this.state.visualisation, visualisationType),
      },
    });
  }

  handleChangeVisualisationTitle(title) {
    this.handleChangeVisualisation({ name: title });
  }

  toggleShareVisualisation() {
    this.setState({
      isShareModalVisible: !this.state.isShareModalVisible,
    });
  }

  handleVisualisationAction(action) {
    const url = `${window.location.origin}/visualisation/${this.state.visualisation.id}`;
    const { visualisation } = this.state;
    switch (action) {
      case 'share': {
        trackEvent(SHARE_VISUALISATION, url);
        this.toggleShareVisualisation();
        break;
      }
      case 'export_png': {
        trackEvent(EXPORT_VISUALISATION_PNG, url);
        this.props.dispatch(
          actions.exportVisualisation(this.state.visualisation.id, { title: visualisation.name })
        );
        break;
      }
      case 'export_pdf': {
        trackEvent(EXPORT_VISUALISATION_PDF, url);
        this.props.dispatch(
          actions.exportVisualisation(this.state.visualisation.id, {
            format: 'pdf',
            title: visualisation.name,
          })
        );
        break;
      }
      default:
        throw new Error(`Action ${action} not yet implemented`);
    }
  }

  handleFetchShareId() {
    const { visualisation } = this.state;
    this.props.dispatch(actions.fetchShareId(visualisation.id));
  }

  // Filter datasets to only include status OK datasets
  datasets() {
    const datasets = Object.assign({}, this.props.library.datasets);
    Object.keys(datasets).forEach((datasetId) => {
      if (entity.getStatus(datasets[datasetId]) !== 'OK') {
        delete datasets[datasetId];
      }
    });
    return datasets;
  }

  render() {
    if (
      this.state.visualisation == null ||
      !this.state.asyncComponents ||
      this.state.isSavePending
    ) {
      return <LoadingSpinner />;
    }
    const { VisualisationHeader, VisualisationEditor } = this.state.asyncComponents;
    const { visualisation } = this.state;
    const { exporting, history } = this.props;

    return (
      <NavigationPrompt shouldPrompt={this.state.savingFailed} history={history}>
        <BodyClassName className={exporting ? 'exporting' : ''}>
          <div className="Visualisation">
            {!exporting && (
              <VisualisationHeader
                isUnsavedChanges={this.state.isUnsavedChanges}
                visualisation={visualisation}
                onVisualisationAction={this.handleVisualisationAction}
                onChangeTitle={this.handleChangeVisualisationTitle}
                onBeginEditTitle={() => this.setState({ isUnsavedChanges: true })}
                onSaveVisualisation={this.onSave}
                savingFailed={this.state.savingFailed}
                history={this.props.history}
                timeToNextSave={this.state.timeToNextSave - this.state.timeFromPreviousSave}
                isExporting={get(this.props, `library.visualisations[${visualisation.id}].isExporting`)}
              />
            )}
            <VisualisationEditor
              visualisation={visualisation}
              datasets={this.datasets()}
              rasters={this.props.library.rasters}
              onChangeTitle={this.handleChangeVisualisationTitle}
              onChangeVisualisationType={this.handleChangeVisualisationType}
              onChangeSourceDataset={this.handleChangeSourceDataset}
              onChangeVisualisationSpec={this.handleChangeVisualisationSpec}
              onSaveVisualisation={this.onSave}
              loadDataset={this.loadDataset}
              exporting={exporting}
            />
            {!exporting && (
              <ShareEntity
                isOpen={this.state.isShareModalVisible}
                onClose={this.toggleShareVisualisation}
                title={visualisation.name}
                shareId={visualisation.shareId}
                type={visualisation.type}
                onFetchShareId={this.handleFetchShareId}
              />
            )}
          </div>
        </BodyClassName>
      </NavigationPrompt>
    );
  }
}

Visualisation.propTypes = {
  intl: intlShape,
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  library: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  params: PropTypes.object,
  exporting: PropTypes.bool,
};

export default connect(state => state)(injectIntl(Visualisation));
