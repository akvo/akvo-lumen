import React, { Component, PropTypes } from 'react';
import VisualisationConfig from './VisualisationConfig';
import VisualisationPreview from './VisualisationPreview';

require('../../styles/VisualisationEditor.scss');

export default class VisualisationEditor extends Component {
  render() {
    return (
      <div className="VisualisationEditor">
        <VisualisationConfig
          {...this.props}
          />
        <VisualisationPreview
          visualisation={this.props.visualisation}
          datasets={this.props.datasets}
        />
      </div>
    );
  }
}

VisualisationEditor.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};
