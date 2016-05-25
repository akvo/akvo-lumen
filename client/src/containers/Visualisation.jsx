import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import update from 'react-addons-update';
import VisualisationHeader from '../components/visualisation/VisualisationHeader';
import VisualisationEditor from '../components/visualisation/VisualisationEditor';
import ShareEntity from '../components/modals/ShareEntity';
import * as actions from '../actions/visualisation';
import { fetchDataset } from '../actions/dataset';
import { push } from 'react-router-redux';

require('../styles/Visualisation.scss');

const getEditingStatus = location => {
  const testString = 'create';

  return location.pathname.indexOf(testString) === -1;
};

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
    const isEditingExistingVisualisation = getEditingStatus(this.props.location);

    if (isEditingExistingVisualisation) {
      const visualisationId = this.props.params.visualisationId;
      this.props.dispatch(actions.fetchVisualisation(visualisationId));
      this.setState({
        visualisation: this.props.library.visualisations[visualisationId],
        isUnsavedChanges: false,
      });
    }
  }

  componentWillReceiveProps() {
    // Need more intelligent merge
    if (this.props.params.visualsationId != null) {
      this.setState({
        visualisation: this.props.library.visualisations[this.props.params.visualisationId],
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
    if (!this.props.library.datasets[datasetId].columns) {
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
