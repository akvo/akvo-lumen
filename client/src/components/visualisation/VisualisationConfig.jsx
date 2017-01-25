import React, { PropTypes } from 'react';
import ConfigMenu from './ConfigMenu';

require('../../styles/VisualisationConfig.scss');

export default function VisualisationConfig(props) {
  const vType = props.visualisation.visualisationType ?
    props.visualisation.visualisationType : 'noVisualisationType';
  return (
    <div
      className={`VisualisationConfig ${vType}`}
    >
      <ConfigMenu
        visualisation={props.visualisation}
        datasets={props.datasets}
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
  onChangeVisualisationType: PropTypes.func.isRequired,
  onChangeSourceDataset: PropTypes.func.isRequired,
  onChangeVisualisationSpec: PropTypes.func.isRequired,
  onSaveVisualisation: PropTypes.func.isRequired,
};
