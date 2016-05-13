import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import VisualisationHeader from '../components/visualisation/VisualisationHeader';
import VisualisationEditor from '../components/visualisation/VisualisationEditor';
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
      type: 'visualisation',
      visualisationType: null,
      name: 'Untitled Chart',
      sourceDataset: null,
      datasetColumnX: null,
      datasetNameColumnX: null,
      labelX: null,
      minX: null,
      maxX: null,
      datasetColumnY: null,
      labelY: null,
      minY: null,
      maxY: null,
      isUnsavedChanges: null,
    };

    this.handleChangeSourceDataset = this.handleChangeSourceDataset.bind(this);
  }

  componentWillMount() {
    const isEditingExistingVisualisation = getEditingStatus(this.props.location);

    if (isEditingExistingVisualisation) {
      const visualisationId = this.props.params.visualisationId;
      this.props.dispatch(actions.fetchVisualisation(visualisationId));
      this.setState(this.props.library.visualisations[visualisationId]);
      this.setState({ isUnsavedChanges: null });
    }
  }

  componentWillReceiveProps() {
    this.setState(this.props.library.visualisations[this.props.params.visualisationId]);
  }

  onSave() {
    this.setState({
      isUnsavedChanges: false,
    });
    if (this.state.id) {
      this.props.dispatch(actions.saveVisualisationChanges(this.state));
    } else {
      this.props.dispatch(actions.createVisualisation(this.state));
    }
    this.props.dispatch(push('/library?filter=visualisations&sort=created'));
  }

  handleChangeSourceDataset(value) {
    const datasetId = value;
    if (!this.props.library.datasets[datasetId].columns) {
      this.props.dispatch(fetchDataset(datasetId));
    }
    this.setState({
      sourceDataset: datasetId,
      isUnsavedChanges: true,
    });
  }

  render() {
    return (
      <div className="Visualisation">
        <VisualisationHeader
          visualisation={this.state}
        />
        <VisualisationEditor
          visualisation={this.state}
          datasets={this.props.library.datasets}
          onChangeTitle={event => (
            this.setState({
              name: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onChangeVisualisationType={value => (
            this.setState({
              visualisationType: value,
              isUnsavedChanges: true,
            })
          )}
          onChangeSourceDataset={value => (
            this.handleChangeSourceDataset(value)
          )}
          onChangeDatasetColumnX={value => (
            this.setState({
              datasetColumnX: value,
              isUnsavedChanges: true,
            })
          )}
          onChangeDatasetNameColumnX={value => (
            this.setState({
              datasetNameColumnX: value,
              isUnsavedChanges: true,
            })
          )}
          onChangeDatasetLabelX={event => (
            this.setState({
              labelX: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onChangeDatasetColumnY={value => (
            this.setState({
              datasetColumnY: value,
              isUnsavedChanges: true,
            })
          )}
          onChangeDatasetLabelY={event => (
            this.setState({
              labelY: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onSaveDataset={() => (
            this.onSave()
          )}
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
