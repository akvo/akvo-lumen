import React, { PropTypes } from 'react';
import ConfigMenu from './ConfigMenu';

require('../../styles/VisualisationConfig.scss');

export default function VisualisationConfig(props) {
  return (
    <div className="VisualisationConfig">
      <h3 className="title">Configure Visualisation</h3>
      <ConfigMenu
        visualisation={props.visualisation}
        datasets={props.datasets}
        onChangeTitle={props.onChangeTitle}
        onChangeSourceDataset={props.onChangeSourceDataset}
        onChangeVisualisationSpec={props.onChangeVisualisationSpec}
        onChangeVisualisationType={props.onChangeVisualisationType}
        onSaveVisualisation={props.onSaveVisualisation}
      />
    </div>
  );
}

VisualisationConfig.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
  onChangeSourceDataset: PropTypes.func.isRequired,
  onChangeVisualisationSpec: PropTypes.func.isRequired,
  onSaveVisualisation: PropTypes.func.isRequired,
};
