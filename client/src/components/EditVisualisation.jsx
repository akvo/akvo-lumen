import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import EditVisualisationHeader from './editVisualisation/EditVisualisationHeader';
import EditVisualisationEditor from './editVisualisation/EditVisualisationEditor';
import { createVisualisation } from '../actions/visualisation';

require('../styles/EditVisualisation.scss');

class EditVisualisation extends Component {

  constructor() {
    super();
    this.state = {
      visualisationType: null,
      title: 'Untitled Chart',
      dataAxis: 'xAxis',
      sourceDatasetX: null,
      datasetColumnX: null,
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

  onSave() {
    this.setState({
      isUnsavedChanges: false,
    });
    this.props.dispatch(createVisualisation(this.state));
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
              title: event.target.value,
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
};

export default connect(state => state)(EditVisualisation);
