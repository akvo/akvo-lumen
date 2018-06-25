import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'react-addons-update';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { intlShape, injectIntl } from 'react-intl';
import ShareEntity from '../components/modals/ShareEntity';
import LoadingSpinner from '../components/common/LoadingSpinner';
import NavigationPrompt from '../components/common/NavigationPrompt';
import * as actions from '../actions/visualisation';
import * as entity from '../domain/entity';
import { fetchDataset } from '../actions/dataset';
import { trackPageView, trackEvent } from '../utilities/analytics';
import { fetchLibrary } from '../actions/library';
import mapSpecTemplate from './Visualisation/mapSpecTemplate';
import pieSpecTemplate from './Visualisation/pieSpecTemplate';
import lineSpecTemplate from './Visualisation/lineSpecTemplate';
import pivotTableSpecTemplate from './Visualisation/pivotTableSpecTemplate';
import scatterSpecTemplate from './Visualisation/scatterSpecTemplate';
import barSpecTemplate from './Visualisation/barSpecTemplate';
import { SAVE_COUNTDOWN_INTERVAL, SAVE_INITIAL_TIMEOUT } from '../constants/time';

require('../components/visualisation/Visualisation.scss');

class Visualisation extends Component {

  constructor(props) {
    super(props);
    this.state = {
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
      asyncComponents: null,
      timeToNextSave: SAVE_INITIAL_TIMEOUT,
      timeFromPreviousSave: 0,
    };

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

  componentWillMount() {
    const { params, library, dispatch } = this.props;
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
        dispatch(actions.fetchVisualisation(visualisationId));
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

        this.setState({
          visualisation,
          isUnsavedChanges: false,
        }, () => {
          this.handleTrackPageView(visualisation);
        });
      }
    }
  }

  componentDidMount() {
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

  componentWillReceiveProps(nextProps) {
    /* If there is a visualisation to load from the library, and we haven't loaded it yet, load it
    /* from nextProps if it exists there */
    const visualisationId = this.props.params.visualisationId;
    const isEditingExistingVisualisation = visualisationId != null;
    const loadedVisualisation = this.state.visualisation.id != null;
    const nextPropsHasVisualisation = Boolean(nextProps.library.visualisations[visualisationId]);

    if (
      (isEditingExistingVisualisation && !loadedVisualisation && nextPropsHasVisualisation) ||
      get(this.state, 'visualisation.shareId') !== get(nextProps, `library.visualisations[${visualisationId}].shareId`)
    ) {
      const visualisation = nextProps.library.visualisations[visualisationId];
      this.setState({ visualisation }, () => {
        this.handleTrackPageView(visualisation);
      });
    }

    if (!this.props.params.visualisationId && nextProps.params.visualisationId) {
      this.setState({
        isSavePending: false,
      });
    }
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

  // Helper method for...
  handleChangeVisualisation(map) {
    const visualisation = Object.assign({}, this.state.visualisation, map);

    this.setState({
      visualisation,
      isUnsavedChanges: true,
    }, () => {
      this.onSave();
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
    this.loadDataset(datasetId);
    const spec = Object.assign({}, this.state.visualisation.spec, optionalSpecChanges);
    const visualisation = Object.assign({}, this.state.visualisation, { datasetId }, { spec });
    this.handleChangeVisualisation(visualisation);
  }

  handleChangeVisualisationType(visualisationType) {
    let specTemplate;
    switch (visualisationType) {
      case 'map':
        specTemplate = Object.assign({}, mapSpecTemplate);
        break;

      case 'pie':
      case 'donut':
        specTemplate = Object.assign({}, pieSpecTemplate);
        break;

      case 'line':
      case 'area':
        specTemplate = Object.assign({}, lineSpecTemplate);
        break;

      case 'scatter':
        specTemplate = Object.assign({}, scatterSpecTemplate);
        break;

      case 'bar':
        specTemplate = Object.assign({}, barSpecTemplate);
        break;

      case 'pivot table':
        specTemplate = Object.assign({}, pivotTableSpecTemplate);
        break;

      default:
        throw new Error(`Unknown visualisation type ${visualisationType}`);
    }
    this.handleChangeVisualisation({
      visualisationType,
      spec: specTemplate,
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
    switch (action) {
      case 'share': {
        trackEvent(
          'Share visualisation',
          `${window.location.origin}/visualisation/${this.state.visualisation.id}`
        );
        this.toggleShareVisualisation();
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

    return (
      <NavigationPrompt shouldPrompt={this.state.savingFailed}>
        <div className="Visualisation">
          <VisualisationHeader
            isUnsavedChanges={this.state.isUnsavedChanges}
            visualisation={visualisation}
            onVisualisationAction={this.handleVisualisationAction}
            onChangeTitle={this.handleChangeVisualisationTitle}
            onBeginEditTitle={() => this.setState({ isUnsavedChanges: true })}
            onSaveVisualisation={this.onSave}
            savingFailed={this.state.savingFailed}
            timeToNextSave={this.state.timeToNextSave - this.state.timeFromPreviousSave}
          />
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
          />
          <ShareEntity
            isOpen={this.state.isShareModalVisible}
            onClose={this.toggleShareVisualisation}
            title={visualisation.name}
            shareId={visualisation.shareId}
            type={visualisation.type}
            onFetchShareId={this.handleFetchShareId}
          />
        </div>
      </NavigationPrompt>
    );
  }
}

Visualisation.propTypes = {
  intl: intlShape,
  dispatch: PropTypes.func.isRequired,
  library: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  params: PropTypes.object,
};

export default connect(state => state)(injectIntl(Visualisation));
