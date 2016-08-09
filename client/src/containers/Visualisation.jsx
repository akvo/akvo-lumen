import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import update from 'react-addons-update';
import isEmpty from 'lodash/isEmpty';
import { push } from 'react-router-redux';
import ShareEntity from '../components/modals/ShareEntity';
import * as actions from '../actions/visualisation';
import { fetchDataset } from '../actions/dataset';
import { fetchLibrary } from '../actions/library';

require('../styles/Visualisation.scss');

class Visualisation extends Component {

  constructor() {
    super();
    this.state = {
      isShareModalVisible: false,
      isUnsavedChanges: false,
      visualisation: {
        type: 'visualisation',
        name: 'Untitled Chart',
        visualisationType: null,
        datasetId: null,
        spec: {
          datasetColumnX: null,
          datasetNameColumnX: null,
          labelX: null,
          minX: null,
          maxX: null,
          datasetColumnY: null,
          labelY: null,
          minY: null,
          maxY: null,
        },
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
    require.ensure(['../components/charts/DashChart'], () => {
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
    }, 'DashChartPreload');
  }

  componentWillReceiveProps() {
    const visualisationId = this.props.params.visualisationId;
    const isEditingExistingVisualisation = visualisationId != null;

    if (isEditingExistingVisualisation && !this.state.isUnsavedChanges) {
      this.setState({
        visualisation: this.props.library.visualisations[visualisationId],
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
    } else {
      dispatch(actions.createVisualisation(this.state.visualisation));
    }
    dispatch(push('/library?filter=visualisations&sort=created'));
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
    const visualisation = Object.assign(this.state.visualisation, { spec });
    this.setState({
      isUnsavedChanges: true,
      visualisation,
    });
  }

  handleChangeVisualisationType(visualisationType) {
    this.handleChangeVisualisation({ visualisationType });
  }

  handleChangeVisualisationTitle(event) {
    this.handleChangeVisualisation({ name: event.target.value });
  }

  handleChangeSourceDataset(datasetId) {
    if (!this.props.library.datasets[datasetId].get('columns')) {
      this.props.dispatch(fetchDataset(datasetId));
    }
    this.handleChangeVisualisation({ datasetId });
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

    return (
      <div className="Visualisation">
        <VisualisationHeader
          isUnsavedChanges={this.state.isUnsavedChanges}
          visualisation={this.state.visualisation}
          onVisualisationAction={this.handleVisualisationAction}
        />
        <VisualisationEditor
          visualisation={this.state.visualisation}
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
          entity={this.state.visualisation}
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
