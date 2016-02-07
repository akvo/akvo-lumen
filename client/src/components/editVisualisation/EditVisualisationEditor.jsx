import React, { Component, PropTypes } from 'react';
import EditVisualisationConfig from './EditVisualisationConfig';
import EditVisualisationPreview from './EditVisualisationPreview';

require('../../styles/EditVisualisationEditor.scss');

export default class EditVisualisationEditor extends Component {
  render() {
    return (
      <div className="EditVisualisationEditor">
        <EditVisualisationConfig
          {...this.props}
          />
        <EditVisualisationPreview
          visualisation={this.props.visualisation}
          datasets={this.props.datasets}
        />
      </div>
    );
  }
}

EditVisualisationEditor.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};
