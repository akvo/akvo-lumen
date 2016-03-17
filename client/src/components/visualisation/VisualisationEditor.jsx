import React, { PropTypes } from 'react';
import VisualisationConfig from './VisualisationConfig';
import VisualisationPreview from './VisualisationPreview';

require('../../styles/VisualisationEditor.scss');

export default function VisualisationEditor(props) {
  return (
    <div className="VisualisationEditor">
      <VisualisationConfig
        {...props}
      />
      <VisualisationPreview
        visualisation={props.visualisation}
        datasets={props.datasets}
      />
    </div>
  );
}

VisualisationEditor.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};
