import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import EditVisualisationHeader from './editVisualisation/EditVisualisationHeader';
import EditVisualisationEditor from './editVisualisation/EditVisualisationEditor';
import { createVisualisation, saveVisualisationChanges } from '../actions/visualisation';
import { routeActions } from 'react-router-redux';

require('../styles/EditVisualisation.scss');

const getEditingStatus = location => {
  const testString = 'create';

  return location.pathname.indexOf(testString) === -1;
};

class EditVisualisation extends Component {

  constructor() {
    super();
    this.state = {
      type: 'visualisation',
      visualisationType: null,
      name: 'Untitled Chart',
      sourceDatasetX: null,
      datasetColumnX: null,
      datasetNameColumnX: null,
      labelX: null,
      minX: null,
      maxX: null,
      sourceDatasetY: null,
      datasetColumnY: null,
      labelY: null,
      minY: null,
      maxY: null,
      isUnsavedChanges: null,
    };
  }

  componentWillMount() {
    const isEditingExistingVisualisation = getEditingStatus(this.props.location);

    if (isEditingExistingVisualisation) {
      const visualisationId = this.props.params.visualisationId;
      this.setState(this.props.library.visualisations[visualisationId]);
      this.setState({ isUnsavedChanges: null });
    }
  }

  onSave() {
    this.setState({
      isUnsavedChanges: false,
    });
    if (this.state.id) {
      this.props.dispatch(saveVisualisationChanges(this.state));
    } else {
      this.props.dispatch(createVisualisation(this.state));
    }
    this.props.dispatch(routeActions.push('/library?filter=visualisations&sort=created'));
  }

  render() {
    return (
      <div className="EditVisualisation">
        <EditVisualisationHeader
          visualisation={this.state}
        />
        <EditVisualisationEditor
          visualisation={this.state}
          datasets={this.props.library.datasets}
          onChangeTitle={event => (
            this.setState({
              name: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onChangeDataAxis={event => (
            this.setState({
              dataAxis: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onChangeVisualisationType={event => (
            this.setState({
              visualisationType: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onChangeSourceDatasetX={ event => (
            this.setState({
              sourceDatasetX: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onChangeDatasetColumnX={ event => (
            this.setState({
              datasetColumnX: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onChangeDatasetNameColumnX={ event => (
            this.setState({
              datasetNameColumnX: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onChangeDatasetLabelX={ event => (
            this.setState({
              labelX: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onChangeSourceDatasetY={ event => (
            this.setState({
              sourceDatasetY: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onChangeDatasetColumnY={ event => (
            this.setState({
              datasetColumnY: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onChangeDatasetLabelY={ event => (
            this.setState({
              labelY: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onSaveDataset={ () => (
            this.onSave()
          )}
        />
      </div>
    );
  }
}

EditVisualisation.propTypes = {
  dispatch: PropTypes.func.isRequired,
  library: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  params: PropTypes.object,
};

export default connect(state => state)(EditVisualisation);
