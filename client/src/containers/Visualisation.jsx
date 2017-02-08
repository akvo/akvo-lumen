import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import update from 'react-addons-update';
import { isEmpty } from 'lodash';
import ShareEntity from '../components/modals/ShareEntity';
import * as actions from '../actions/visualisation';
import { fetchDataset } from '../actions/dataset';
import { fetchLibrary } from '../actions/library';
import mapSpecTemplate from './Visualisation/mapSpecTemplate';
import pieSpecTemplate from './Visualisation/pieSpecTemplate';
import lineSpecTemplate from './Visualisation/lineSpecTemplate';
import scatterSpecTemplate from './Visualisation/scatterSpecTemplate';
import barSpecTemplate from './Visualisation/barSpecTemplate';

require('../styles/Visualisation.scss');

class Visualisation extends Component {

  constructor() {
    super();
    this.state = {
      isShareModalVisible: false,
      isUnsavedChanges: false,
      isSavePending: false,
      visualisation: {
        type: 'visualisation',
        name: 'Untitled visualisation',
        visualisationType: null,
        datasetId: null,
        spec: {},
      },
      asyncComponents: null,
    };

    this.onSave = this.onSave.bind(this);
    this.handleChangeVisualisationSpec = this.handleChangeVisualisationSpec.bind(this);
    this.handleChangeVisualisation = this.handleChangeVisualisation.bind(this);
    this.handleChangeSourceDataset = this.handleChangeSourceDataset.bind(this);
    this.handleChangeVisualisationTitle = this.handleChangeVisualisationTitle.bind(this);
    this.handleChangeVisualisationType = this.handleChangeVisualisationType.bind(this);
    this.handleVisualisationAction = this.handleVisualisationAction.bind(this);
    this.toggleShareVisualisation = this.toggleShareVisualisation.bind(this);
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
        const datasetId = visualisation.datasetId;
        if (datasetId != null) {
          if (library.datasets[datasetId] == null ||
              library.datasets[datasetId].get('rows') == null) {
            dispatch(fetchDataset(datasetId));
          }
        }
        this.setState({
          visualisation,
          isUnsavedChanges: false,
        });
      }
    }
  }

  componentDidMount() {
    require.ensure(['../components/charts/VisualisationViewer'], () => {
      require.ensure([], () => {
        /* eslint-disable global-require */
        const VisualisationHeader =
          require('../components/visualisation/VisualisationHeader').default;
        const VisualisationEditor =
          require('../components/visualisation/VisualisationEditor').default;
        require('../styles/Visualisation.scss');
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

    if (isEditingExistingVisualisation && !loadedVisualisation && nextPropsHasVisualisation) {
      this.setState({
        visualisation: nextProps.library.visualisations[visualisationId],
      });
    }

    if (!this.props.params.visualisationId && nextProps.params.visualisationId) {
      this.setState({
        isSavePending: false,
      });
    }
  }

  onSave() {
    const { dispatch } = this.props;
    this.setState({
      isUnsavedChanges: false,
    });
    if (this.state.visualisation.id) {
      dispatch(actions.saveVisualisationChanges(this.state.visualisation));
    } else if (!this.state.isSavePending) {
      this.setState({ isSavePending: true });
      dispatch(actions.createVisualisation(this.state.visualisation));
    } else {
        // Ignore save request for now
    }
  }

  // Helper method for...
  handleChangeVisualisation(map) {
    const visualisation = Object.assign({}, this.state.visualisation, map);

    this.setState({
      visualisation,
      isUnsavedChanges: true,
    });
  }

  handleChangeVisualisationSpec(value) {
    const spec = update(this.state.visualisation.spec, { $merge: value });
    const visualisation = Object.assign({}, this.state.visualisation, { spec });

    this.handleChangeVisualisation(visualisation);
  }

  handleChangeSourceDataset(datasetId, optionalSpecChanges = {}) {
    if (!this.props.library.datasets[datasetId].get('columns')) {
      this.props.dispatch(fetchDataset(datasetId));
    }
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
      case 'share':
        this.toggleShareVisualisation();
        break;
      default:
        throw new Error(`Action ${action} not yet implemented`);
    }
  }

  render() {
    if (this.state.visualisation == null || !this.state.asyncComponents) {
      return <div className="Visualisation">Loading...</div>;
    }
    const { VisualisationHeader, VisualisationEditor } = this.state.asyncComponents;
    const visualisation = this.state.visualisation;

    return (
      <div className="Visualisation">
        <VisualisationHeader
          isUnsavedChanges={this.state.isUnsavedChanges}
          visualisation={visualisation}
          onVisualisationAction={this.handleVisualisationAction}
          onChangeTitle={this.handleChangeVisualisationTitle}
          onBeginEditTitle={() => this.setState({ isUnsavedChanges: true })}
        />
        <VisualisationEditor
          visualisation={visualisation}
          datasets={this.props.library.datasets}
          onChangeTitle={this.handleChangeVisualisationTitle}
          onChangeVisualisationType={this.handleChangeVisualisationType}
          onChangeSourceDataset={this.handleChangeSourceDataset}
          onChangeVisualisationSpec={this.handleChangeVisualisationSpec}
          onSaveVisualisation={this.onSave}
        />
        <ShareEntity
          isOpen={this.state.isShareModalVisible}
          onClose={this.toggleShareVisualisation}
          title={visualisation.name}
          id={visualisation.id}
          type={visualisation.type}
        />
      </div>
    );
  }
}

Visualisation.propTypes = {
  dispatch: PropTypes.func.isRequired,
  library: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  params: PropTypes.object,
};

export default connect(state => state)(Visualisation);
