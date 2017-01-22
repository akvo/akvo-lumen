import React, { PropTypes } from 'react';
import VisualisationConfig from './VisualisationConfig';
import VisualisationPreview from './VisualisationPreview';

require('../../styles/VisualisationEditor.scss');

export default function VisualisationEditor(props) {
  return (
    <div className="VisualisationEditor">
      <VisualisationConfig
        visualisation={props.visualisation}
        datasets={props.datasets}
        onChangeTitle={props.onChangeTitle}
        onChangeVisualisationType={props.onChangeVisualisationType}
        onChangeSourceDataset={props.onChangeSourceDataset}
        onChangeVisualisationSpec={props.onChangeVisualisationSpec}
        onSaveVisualisation={props.onSaveVisualisation}
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
  onChangeTitle: PropTypes.func.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
  onChangeSourceDataset: PropTypes.func.isRequired,
  onChangeVisualisationSpec: PropTypes.func.isRequired,
  onSaveVisualisation: PropTypes.func.isRequired,
};
